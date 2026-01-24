
import AgoraRTC, { IAgoraRTCClient, IMicrophoneAudioTrack } from "agora-rtc-sdk-ng";

const APP_ID = "9209e41821f34b4bb3d5bc8391d86cdc";

class AgoraService {
  private client: IAgoraRTCClient | null = null;
  private localAudioTrack: IMicrophoneAudioTrack | null = null;
  private joinInProgress = false;

  constructor() {
    AgoraRTC.setLogLevel(2); 
  }

  async init() {
    if (this.client) return;
    this.client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    
    this.client.on("user-published", async (user, mediaType) => {
      if (mediaType === "audio") {
        try {
          await this.client?.subscribe(user, mediaType);
          user.audioTrack?.play();
        } catch (e) {
          console.error("Agora Subscribe Error:", e);
        }
      }
    });

    this.client.on("user-unpublished", (user) => {
      if (user.audioTrack) {
        user.audioTrack.stop();
      }
    });
  }

  async join(channelName: string, uid: string) {
    await this.init();
    if (!this.client) return;

    // التحقق من الحالة لمنع INVALID_OPERATION
    const state = this.client.connectionState;
    if (state === "CONNECTED" || state === "CONNECTING" || this.joinInProgress) {
      console.log(`[Agora] Join skipped: Current state is ${state}`);
      return;
    }

    this.joinInProgress = true;
    try {
      await this.client.join(APP_ID, channelName, null, uid);
      console.log(`[Agora] Joined: ${channelName}`);
    } catch (e: any) {
      if (e.code !== "WS_ABORT") console.error("[Agora] Join Error:", e);
    } finally {
      this.joinInProgress = false;
    }
  }

  async publishAudio() {
    if (!this.client || this.client.connectionState !== "CONNECTED") return;

    try {
      if (!this.localAudioTrack) {
        this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
          AEC: true, ANS: true, AGC: true
        });
      }
      
      // منع النشر المزدوج
      const isAlreadyPublished = this.client.localTracks.some(t => t.trackMediaType === "audio");
      if (!isAlreadyPublished) {
        await this.client.publish(this.localAudioTrack);
        console.log("[Agora] Audio Published");
      }
    } catch (e) {
      console.error("[Agora] Publish Error:", e);
    }
  }

  async unpublishAudio() {
    if (!this.client || !this.localAudioTrack) return;
    try {
      if (this.client.connectionState === "CONNECTED") {
        await this.client.unpublish(this.localAudioTrack);
      }
      this.localAudioTrack.stop();
      this.localAudioTrack.close();
      this.localAudioTrack = null;
    } catch (e) {
      console.error("[Agora] Unpublish Error:", e);
    }
  }

  async setMute(muted: boolean) {
    if (this.localAudioTrack) {
      try {
        await this.localAudioTrack.setEnabled(!muted);
      } catch (e) {
        console.error("[Agora] Mute Update Error:", e);
      }
    }
  }

  async leave() {
    if (!this.client) return;
    try {
      await this.unpublishAudio();
      const state = this.client.connectionState;
      if (state !== "DISCONNECTED" && state !== "DISCONNECTING") {
        await this.client.leave();
      }
      this.joinInProgress = false;
      console.log("[Agora] Left channel");
    } catch (e) {
      console.error("[Agora] Leave Error:", e);
    }
  }
}

export const agoraService = new AgoraService();
