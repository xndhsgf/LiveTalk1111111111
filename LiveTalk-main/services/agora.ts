import AgoraRTC, { IAgoraRTCClient, IMicrophoneAudioTrack } from "agora-rtc-sdk-ng";

const APP_ID = "9209e41821f34b4bb3d5bc8391d86cdc";

class AgoraService {
  private client: IAgoraRTCClient | null = null;
  private localAudioTrack: IMicrophoneAudioTrack | null = null;
  private isInitialized = false;
  private isJoined = false;
  private joinPromise: Promise<void> | null = null;

  async init() {
    if (this.isInitialized) return;
    this.client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    
    // إعداد المستمعين للأصوات البعيدة
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
      user.audioTrack?.stop();
    });

    this.isInitialized = true;
  }

  async join(channelName: string, uid: string) {
    if (this.isJoined) return;
    if (this.joinPromise) return this.joinPromise;

    await this.init();
    
    this.joinPromise = (async () => {
      try {
        await this.client?.join(APP_ID, channelName, null, uid);
        this.isJoined = true;
        console.log("Joined Agora Channel:", channelName);
      } catch (e) {
        console.error("Agora Join Error:", e);
        this.isJoined = false;
        throw e;
      } finally {
        this.joinPromise = null;
      }
    })();

    return this.joinPromise;
  }

  async publishAudio() {
    // الانتظار حتى اكتمال الانضمام إذا كان جارياً
    if (this.joinPromise) {
      await this.joinPromise;
    }

    if (!this.isJoined || !this.client) {
      console.warn("Agora: Cannot publish, client not joined yet.");
      return;
    }

    try {
      if (!this.localAudioTrack) {
        this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
          AEC: true, ANS: true, AGC: true
        });
      }
      
      // التحقق من حالة الاتصال قبل النشر
      if (this.client.connectionState === "CONNECTED") {
        await this.client.publish(this.localAudioTrack);
        console.log("Audio Published");
      }
    } catch (e) {
      console.error("Agora Publish Error:", e);
    }
  }

  async unpublishAudio() {
    if (!this.isJoined || !this.client) return;

    try {
      if (this.localAudioTrack) {
        if (this.client.connectionState === "CONNECTED") {
          await this.client.unpublish(this.localAudioTrack);
        }
        this.localAudioTrack.stop();
        this.localAudioTrack.close();
        this.localAudioTrack = null;
        console.log("Audio Unpublished");
      }
    } catch (e) {
      console.error("Agora Unpublish Error:", e);
    }
  }

  async setMute(muted: boolean) {
    if (this.localAudioTrack) {
      try {
        await this.localAudioTrack.setEnabled(!muted);
      } catch (e) {
        console.error("Agora Mute Error:", e);
      }
    }
  }

  async leave() {
    try {
      await this.unpublishAudio();
      if (this.client) {
        await this.client.leave();
      }
      this.isJoined = false;
      this.joinPromise = null;
      console.log("Left Agora Channel");
    } catch (e) {
      console.error("Agora Leave Error:", e);
    }
  }
}

export const agoraService = new AgoraService();