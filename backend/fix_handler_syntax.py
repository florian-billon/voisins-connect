from pathlib import Path
import re
root = Path('src/handlers')
for path in root.glob('*.rs'):
    text = path.read_text(encoding='utf-8')
    orig = text
    replacements = {
        'ctx.user_id( })': 'ctx.user_id()',
        'payload.emoji.trim( })': 'payload.emoji.trim()',
        'chrono::Utc::now( })': 'chrono::Utc::now()',
        'username.clone( })': 'username.clone()',
        'response.clone( })': 'response.clone()',
        'updated_upload.into( } })': 'updated_upload.into()',
        'user.into( } })': 'user.into()',
        'call.into( } })': 'call.into()',
        'updated_call.into( } })': 'updated_call.into()',
        'ended_call.into( } })': 'ended_call.into()',
        'Ok(Json(vec![] });': 'Ok(Json(vec![]));',
        'Ok(Json(invite });': 'Ok(Json(invite));',
        'Ok(Json(users });': 'Ok(Json(users));',
        'Ok(Json(user });': 'Ok(Json(user));',
        'Ok(Json(server });': 'Ok(Json(server));',
        'Ok(Json(servers });': 'Ok(Json(servers));',
        'Ok(Json(member });': 'Ok(Json(member));',
        'Ok(Json(members_with_user });': 'Ok(Json(members_with_user));',
        'Ok(Json(ban });': 'Ok(Json(ban));',
        'Ok(Json(bans });': 'Ok(Json(bans));',
        'Ok(Json(channel });': 'Ok(Json(channel));',
        'Ok(Json(channels });': 'Ok(Json(channels));',
        'Ok(Json(conversation });': 'Ok(Json(conversation));',
        'Ok(Json(conversations });': 'Ok(Json(conversations));',
        'Ok(Json(response });': 'Ok(Json(response));'
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    text = re.sub(r'Ok\(Json\(([^\)]+) \}\)', r'Ok(Json(\1))', text)
    text = re.sub(r'Some\(&state\.ws_metrics \}\)', r'Some(&state.ws_metrics))', text)
    text = re.sub(r'Json\(serde_json::json!\(\{ "server_id": server_id \} \} \}\)', r'Json(serde_json::json!({ "server_id": server_id }))', text)
    if text != orig:
        path.write_text(text, encoding='utf-8')
        print('Updated', path)
