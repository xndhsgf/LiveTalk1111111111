
import AgoraRTC, { IAgoraRTCClient, IMicrophoneAudioTrack } from "agora-rtc-sdk-ng";

const APP_ID = "9209e41821f34b4bb3d5bc8391d86cdc";

class AgoraService {
  private client: IAgoraRTCClient | null = null;
  private localAudioTrack: IMicrophoneAudioTrack | null = null;
  private isJoined = false;
  private joinInProgress = false;

  constructor() {
    // تقليل مستوى السجلات لتجنب ازدحام الكونسول وتحسين الأداء
    AgoraRTC.setLogLevel(2); 
  }

  async init() {
    if (this.client) return;
    
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
      if (user.audioTrack) {
        user.audioTrack.stop();
      }
    });
  }

  async join(channelName: string, uid: string) {
    // منع الانضمام المتكرر إذا كانت هناك عملية جارية أو تم الانضمام بالفعل
    if (this.isJoined || this.joinInProgress) return;
    
    await this.init();
    if (!this.client) return;

    this.joinInProgress = true;
    try {
      await this.client.join(APP_ID, channelName, null, uid);
      this.isJoined = true;
      console.log(`[Agora] Joined channel: ${channelName}`);
    } catch (e: any) {
      // تجاهل أخطاء التداخل البسيطة التي يسببها React lifecycle
      if (e.code !== "WS_ABORT") {
        console.error("[Agora] Join Error:", e);
      }
      this.isJoined = false;
      throw e;
    } finally {
      this.joinInProgress = false;
    }
  }

  async publishAudio() {
    if (!this.isJoined || !this.client) return;

    try {
      if (!this.localAudioTrack) {
        this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
          AEC: true, // إلغاء الصدى
          ANS: true, // تقليل الضوضاء
          AGC: true  // التحكم التلقائي في مستوى الصوت
        });
      }
      
      // التأكد من عدم النشر المزدوج
      if (this.client.localTracks.length === 0) {
        await this.client.publish(this.localAudioTrack);
        console.log("[Agora] Audio Track Published");
      }
    } catch (e) {
      console.error("[Agora] Publish Error:", e);
    }
  }

  async unpublishAudio() {
    if (!this.client || !this.localAudioTrack) return;

    try {
      // إلغاء النشر فقط إذا كان هناك مسار نشط
      if (this.client.localTracks.length > 0) {
        await this.client.unpublish(this.localAudioTrack);
      }
      this.localAudioTrack.stop();
      this.localAudioTrack.close();
      this.localAudioTrack = null;
      console.log("[Agora] Audio Track Unpublished");
    } catch (e) {
      console.error("[Agora] Unpublish Error:", e);
    }
  }

  async setMute(muted: boolean) {
    if (this.localAudioTrack) {
      try {
        await this.localAudioTrack.setEnabled(!muted);
      } catch (e) {
        console.error("[Agora] Mute State Update Error:", e);
      }
    }
  }

  async leave() {
    try {
      await this.unpublishAudio();
      
      if (this.client) {
        // التأكد من أن حالة الاتصال تسمح بالمغادرة
        if (this.isJoined) {
          await this.client.leave();
        }
      }
      
      this.isJoined = false;
      this.joinInProgress = false;
      console.log("[Agora] Left channel and cleaned up resources");
    } catch (e) {
      console.error("[Agora] Leave Error:", e);
    }
  }
}

export const agoraService = new AgoraService();
