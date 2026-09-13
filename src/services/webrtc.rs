use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// WebRTC Signaling message types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum SignalingMessage {
    #[serde(rename = "offer")]
    Offer {
        from: Uuid,
        to: Uuid,
        offer: serde_json::Value, // SDP offer
    },

    #[serde(rename = "answer")]
    Answer {
        from: Uuid,
        to: Uuid,
        answer: serde_json::Value, // SDP answer
    },

    #[serde(rename = "ice-candidate")]
    IceCandidate {
        from: Uuid,
        to: Uuid,
        candidate: serde_json::Value, // ICE candidate
    },

    #[serde(rename = "call-started")]
    CallStarted {
        call_id: Uuid,
        initiator: Uuid,
        recipient: Uuid,
    },

    #[serde(rename = "call-ended")]
    CallEnded { call_id: Uuid },

    #[serde(rename = "call-rejected")]
    CallRejected { call_id: Uuid, reason: String },

    #[serde(rename = "error")]
    Error { message: String },
}

#[derive(Clone)]
pub struct WebRTCService {
    // This is mainly for signaling logic
    // Actual connection is handled by browser WebRTC API
}

impl WebRTCService {
    pub fn new() -> Self {
        Self {}
    }

    /// Validate SDP offer
    pub fn validate_offer(offer: &serde_json::Value) -> bool {
        offer.get("type").and_then(|t| t.as_str()) == Some("offer") && offer.get("sdp").is_some()
    }

    /// Validate SDP answer
    pub fn validate_answer(answer: &serde_json::Value) -> bool {
        answer.get("type").and_then(|t| t.as_str()) == Some("answer") && answer.get("sdp").is_some()
    }

    /// Validate ICE candidate
    pub fn validate_ice_candidate(candidate: &serde_json::Value) -> bool {
        candidate.get("candidate").is_some() || candidate.get("candidate").is_none()
        // ICE can have empty candidate (end of candidates)
    }

    /// Create offer message
    pub fn create_offer(from: Uuid, to: Uuid, offer: serde_json::Value) -> SignalingMessage {
        SignalingMessage::Offer { from, to, offer }
    }

    /// Create answer message
    pub fn create_answer(from: Uuid, to: Uuid, answer: serde_json::Value) -> SignalingMessage {
        SignalingMessage::Answer { from, to, answer }
    }

    /// Create ICE candidate message
    pub fn create_ice_candidate(
        from: Uuid,
        to: Uuid,
        candidate: serde_json::Value,
    ) -> SignalingMessage {
        SignalingMessage::IceCandidate {
            from,
            to,
            candidate,
        }
    }
}

impl Default for WebRTCService {
    fn default() -> Self {
        Self::new()
    }
}
