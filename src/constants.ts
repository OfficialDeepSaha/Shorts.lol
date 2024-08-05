

export const USERS_TABLE = 'users'; // Adjust the table name as needed

export enum PaymentType {
    BASIC = 'BASIC',
    STANDARD = 'STANDARD',
    PREMIUM = 'PREMIUM',
    FREE = "FREE"
}


export enum TokenLimit {
    FREE = 20,
    BASIC = 100,
    STANDARD = 500,
    PREMIUM = 1000
}

// Define TOKEN_LIMITS with type constants
export const TOKEN_LIMITS = {
    BASIC: TokenLimit.BASIC,
    STANDARD: TokenLimit.STANDARD,
    PREMIUM: TokenLimit.PREMIUM,
    FREE: TokenLimit.FREE,
} as const;



export type VideoTable = {
    thumbnail_url: string;
    error_message: any;
    id: number;
    title: string;
    // Add other properties as needed
    created_at?: string; // or Date if it's a Date object
    ge?: string;
    url?: string; // Add this property
    current_step?: number;
    has_prompt?: boolean;      // Add these properties
    has_images?: boolean;
    has_voiceover?: boolean;
    has_subtitles?: boolean;
};



export enum VideoGenerationStages {
  PROMPT = 'Writing script',  // Add other stages as needed
  VOICEOVER = 'Recording voice',
  SUBTITLES = 'Adding subtitles',
  IMAGES = 'Generating images',
  VIDEO = 'Crafting video',
  UPLOAD = 'Upload',
  PROCESSING = 'Processing',
  RENDERING = 'Rendering',
  COMPLETE = 'Complete',
 

}

export const VIDEO_GENERATION_ORDER: VideoGenerationStages[] = [
  VideoGenerationStages.PROMPT,
  VideoGenerationStages.VOICEOVER,
  VideoGenerationStages.SUBTITLES,
  VideoGenerationStages.IMAGES,
  VideoGenerationStages.VIDEO,
  VideoGenerationStages.UPLOAD,
  VideoGenerationStages.PROCESSING,
  VideoGenerationStages.RENDERING,
  VideoGenerationStages.COMPLETE,
];










export enum AIVoiceIDs {
    MAN = 'man',
    WOMAN = 'woman',
    // Add other voice IDs if needed
}

// Enum for AI Voices
export enum AIVoices {
    MAN = 'MAN',
    WOMAN = 'WOMAN',
    // Add other voices if needed
}


export type PopulatedUser = {
    subscription: any;
    free_credits_used: any;
    id: string;
    email: string;
    created_at? : string;
    
};


export type SubscriptionTable = {
    tokens_used: TokenLimit;
    tier: "BASIC" | "STANDARD" | "PREMIUM" | "FREE";
    id: number;
    user_id: string;
    start_date: string; // or Date if it's a Date object
    end_date: string;   // or Date if it's a Date object
    status: string;
    // Add other properties as needed
  };

  export const SUBSCRIPTIONS_TABLE = 'subscriptions'; 



  export const VIDEOS_TABLE = 'videos';


  export const EMAILS_TABLE = 'emails'; // Replace 'emails' with the actual table name if different


  export enum SubscriptionStatus {
    ACTIVE = 'Active',
    INACTIVE = 'Inactive',
    EXPIRED = 'Expired',
    // Add other statuses as needed
  }



  // src/types/database.ts
export type Database = {
    public: {
      Tables: {

users : {

  Row: {
    id: string;
    email: string;
    created_at? : string;
  };

  Insert: {
    email: string;
    created_at? : string;
  };
}




        subscriptions: {
          Row: {
            id: string;
            stripe_subscription_id: string;
            user_id: string;
            tier: 'Free' | 'Basic' | 'Premium';
            status: 'Active' | 'Inactive' | 'Expired';
            start_date: string;
            end_date: string;
            tokens_used: number;
          };
          Insert: {
            stripe_subscription_id: string;
            user_id: string;
            tier: 'Free' | 'Basic' | 'Premium';
            status: 'Active' | 'Inactive' | 'Expired';
            start_date: string;
            end_date: string;
            tokens_used: number;
          };
          Update: {
            stripe_subscription_id?: string;
            user_id?: string;
            tier?: 'Free' | 'Basic' | 'Premium';
            status?: 'Active' | 'Inactive' | 'Expired';
            start_date?: string;
            end_date?: string;
            tokens_used?: number;
          };
        };
        // Define other tables here
      };
    };
  };
  