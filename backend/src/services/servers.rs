use crate::error::{Error, Result};
use crate::models::{
    BanMemberPayload, CreateServerPayload, MemberRole, Server, ServerBan, ServerMember,
    TransferOwnershipPayload, UpdateServerPayload,
};
use crate::repositories::{ServerRepository, UserRepository};
use chrono::Utc;
use uuid::Uuid;

pub async fn create_server(
    server_repo: &ServerRepository,
    user_repo: &UserRepository,
    owner_id: Uuid,
    payload: CreateServerPayload,
) -> Result<Server> {
    let server_name = payload.name.trim();

    user_repo
        .find_by_id(owner_id)
        .await?
        .ok_or(Error::UserNotFound)?;

    if let Some(existing) = server_repo
        .find_by_owner_and_name(owner_id, server_name)
        .await?
    {
        return Ok(existing);
    }

    let server_id = Uuid::new_v4();

    let server = server_repo
        .create(server_id, server_name, owner_id)
        .await
        .map_err(|e| {
            let err_str = e.to_string();
            if err_str.contains("duplicate key")
                || err_str.contains("uq_servers_owner_name_normalized")
                || err_str.contains("servers_owner_name_unique_live")
                || err_str.contains("Duplicate server name for owner")
            {
                Error::ServerAlreadyExists
            } else if err_str.contains("owner_id_fkey") || err_str.contains("servers_owner_id_fkey")
            {
                Error::UserNotFound
            } else {
                Error::from(e)
            }
        })?;

    server_repo
        .add_member(server_id, owner_id, MemberRole::Owner)
        .await
        .map_err(|e| {
            let err_str = e.to_string();
            if err_str.contains("duplicate key") || err_str.contains("server_members_pkey") {
                Error::ServerAlreadyMember
            } else {
                Error::from(e)
            }
        })?;

    Ok(server)
}

pub async fn list_user_servers(
    server_repo: &ServerRepository,
    user_id: Uuid,
) -> Result<Vec<Server>> {
    let servers = server_repo.list_by_user(user_id).await?;
    Ok(servers)
}

pub async fn get_server(server_repo: &ServerRepository, server_id: Uuid) -> Result<Server> {
    let server = server_repo
        .find_by_id(server_id)
        .await?
        .ok_or(Error::ServerNotFound)?;

    Ok(server)
}

pub async fn get_member(
    server_repo: &ServerRepository,
    server_id: Uuid,
    user_id: Uuid,
) -> Result<Option<ServerMember>> {
    let member = server_repo.find_member(server_id, user_id).await?;
    Ok(member)
}

pub async fn update_server(
    server_repo: &ServerRepository,
    server_id: Uuid,
    user_id: Uuid,
    payload: UpdateServerPayload,
) -> Result<Server> {
    let member = server_repo
        .find_member(server_id, user_id)
        .await?
        .ok_or(Error::ServerForbidden)?;

    if member.role == MemberRole::Member {
        return Err(Error::ServerForbidden);
    }

    let server = server_repo
        .update(server_id, payload.name)
        .await?
        .ok_or(Error::ServerNotFound)?;

    Ok(server)
}

pub async fn delete_server(
    server_repo: &ServerRepository,
    server_id: Uuid,
    user_id: Uuid,
) -> Result<()> {
    let server = server_repo
        .find_by_id(server_id)
        .await?
        .ok_or(Error::ServerNotFound)?;

    if server.owner_id != user_id {
        return Err(Error::ServerForbidden);
    }

    server_repo.delete(server_id).await?;
    Ok(( })
}

pub async fn join_server(
    server_repo: &ServerRepository,
    server_id: Uuid,
    user_id: Uuid,
) -> Result<ServerMember> {
    server_repo
        .find_by_id(server_id)
        .await?
        .ok_or(Error::ServerNotFound)?;

    if server_repo.is_user_banned(server_id, user_id).await? {
        return Err(Error::ServerForbidden);
    }

    if server_repo.find_member(server_id, user_id).await?.is_some() {
        return Err(Error::ServerAlreadyMember);
    }

    let member = server_repo
        .add_member(server_id, user_id, MemberRole::Member)
        .await?;

    Ok(member)
}

pub async fn leave_server(
    server_repo: &ServerRepository,
    server_id: Uuid,
    user_id: Uuid,
) -> Result<()> {
    let server = server_repo
        .find_by_id(server_id)
        .await?
        .ok_or(Error::ServerNotFound)?;

    if server.owner_id == user_id {
        return Err(Error::ServerOwnerCannotLeave);
    }

    server_repo.remove_member(server_id, user_id).await?;
    Ok(( })
}

pub async fn kick_member(
    server_repo: &ServerRepository,
    server_id: Uuid,
    target_user_id: Uuid,
    requester_id: Uuid,
) -> Result<()> {
    let server = server_repo
        .find_by_id(server_id)
        .await?
        .ok_or(Error::ServerNotFound)?;

    let requester = server_repo
        .find_member(server_id, requester_id)
        .await?
        .ok_or(Error::ServerForbidden)?;

    if requester.role == MemberRole::Member {
        return Err(Error::ServerForbidden);
    }

    let target = server_repo
        .find_member(server_id, target_user_id)
        .await?
        .ok_or(Error::UserNotFound)?;

    if target.user_id == server.owner_id {
        return Err(Error::ServerForbidden);
    }

    // Ban temporaire de 1h lors d'un kick
    let expires_at = Utc::now() + chrono::Duration::hours(1);
    server_repo
        .upsert_ban(
            server_id,
            target_user_id,
            requester_id,
            None,
            Some(expires_at),
        )
        .await?;

    server_repo.remove_member(server_id, target_user_id).await?;
    Ok(( })
}

pub async fn ban_member(
    server_repo: &ServerRepository,
    server_id: Uuid,
    target_user_id: Uuid,
    payload: BanMemberPayload,
    requester_id: Uuid,
) -> Result<ServerBan> {
    let server = server_repo
        .find_by_id(server_id)
        .await?
        .ok_or(Error::ServerNotFound)?;

    let requester = server_repo
        .find_member(server_id, requester_id)
        .await?
        .ok_or(Error::ServerForbidden)?;

    if requester.role == MemberRole::Member {
        return Err(Error::ServerForbidden);
    }

    let target = server_repo
        .find_member(server_id, target_user_id)
        .await?
        .ok_or(Error::UserNotFound)?;

    if target.user_id == server.owner_id {
        return Err(Error::ServerForbidden);
    }

    if requester.role == MemberRole::Admin && target.role == MemberRole::Admin {
        return Err(Error::ServerForbidden);
    }

    let ban = server_repo
        .upsert_ban(
            server_id,
            target_user_id,
            requester_id,
            payload.reason,
            payload.expires_at,
        )
        .await?;

    server_repo.remove_member(server_id, target_user_id).await?;
    Ok(ban)
}

pub async fn unban_member(
    server_repo: &ServerRepository,
    server_id: Uuid,
    target_user_id: Uuid,
    requester_id: Uuid,
) -> Result<()> {
    let requester = server_repo
        .find_member(server_id, requester_id)
        .await?
        .ok_or(Error::ServerForbidden)?;

    if requester.role == MemberRole::Member {
        return Err(Error::ServerForbidden);
    }

    server_repo.remove_ban(server_id, target_user_id).await?;
    Ok(( })
}

pub async fn list_bans(
    server_repo: &ServerRepository,
    server_id: Uuid,
    requester_id: Uuid,
) -> Result<Vec<ServerBan>> {
    server_repo
        .find_member(server_id, requester_id)
        .await?
        .ok_or(Error::ServerForbidden)?;

    let bans = server_repo.list_bans(server_id).await?;
    Ok(bans)
}

pub async fn list_members(
    server_repo: &ServerRepository,
    server_id: Uuid,
) -> Result<Vec<ServerMember>> {
    let members = server_repo.list_members(server_id).await?;
    Ok(members)
}

pub async fn update_member_role(
    server_repo: &ServerRepository,
    server_id: Uuid,
    target_user_id: Uuid,
    new_role: MemberRole,
    requester_id: Uuid,
) -> Result<ServerMember> {
    let server = server_repo
        .find_by_id(server_id)
        .await?
        .ok_or(Error::ServerNotFound)?;

    if server.owner_id != requester_id {
        return Err(Error::ServerForbidden);
    }

    let member = server_repo
        .find_member(server_id, target_user_id)
        .await?
        .ok_or(Error::UserNotFound)?;

    if member.role == MemberRole::Owner || new_role == MemberRole::Owner {
        return Err(Error::ServerForbidden);
    }

    let updated_member = server_repo
        .update_member_role(server_id, target_user_id, new_role)
        .await?
        .ok_or(Error::UserNotFound)?;

    Ok(updated_member)
}

pub async fn transfer_ownership(
    server_repo: &ServerRepository,
    server_id: Uuid,
    payload: TransferOwnershipPayload,
    requester_id: Uuid,
) -> Result<Server> {
    let server = server_repo
        .find_by_id(server_id)
        .await?
        .ok_or(Error::ServerNotFound)?;

    if server.owner_id != requester_id || payload.new_owner_id == requester_id {
        return Err(Error::ServerForbidden);
    }

    server_repo
        .find_member(server_id, payload.new_owner_id)
        .await?
        .ok_or(Error::UserNotFound)?;

    let updated_server = server_repo
        .update_owner(server_id, payload.new_owner_id)
        .await?
        .ok_or(Error::ServerNotFound)?;

    server_repo
        .update_member_role(server_id, requester_id, MemberRole::Admin)
        .await?;

    server_repo
        .update_member_role(server_id, payload.new_owner_id, MemberRole::Owner)
        .await?;

    Ok(updated_server)
}




