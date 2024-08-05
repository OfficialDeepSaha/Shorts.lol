import { VideoGenerationStages , VIDEO_GENERATION_ORDER , VideoTable } from '@/constants';
import { LoadingStates } from '@/constant/videos/loadingState';

export class VideoGenerationStepsService {


   



  static isStepComplete = (
    video: VideoTable,
    step: VideoGenerationStages
  ): boolean => {
    switch (step) {
      case VideoGenerationStages.PROMPT:
        return video.has_prompt === true;
      case VideoGenerationStages.IMAGES:
        return video.has_images === true;
      case VideoGenerationStages.VOICEOVER:
        return video.has_voiceover === true;
      case VideoGenerationStages.SUBTITLES:
        return video.has_subtitles === true;
      case VideoGenerationStages.VIDEO:
        return video.url != null;
      default:
        return false;
    }
  };

  static getCurrentStep(video: VideoTable): VideoGenerationStages {
    for (let i = VIDEO_GENERATION_ORDER.length - 1; i >= 0; i--) {
      const field = VIDEO_GENERATION_ORDER[i];
      const isStepComplete = VideoGenerationStepsService.isStepComplete(
        video,
        field
        
      );

      if (isStepComplete) {
        return VIDEO_GENERATION_ORDER[i + 1] as VideoGenerationStages; // Type assertion
      }
    }

    return VIDEO_GENERATION_ORDER[0] as VideoGenerationStages; // Type assertion
  }

  static getStepIndex(step: VideoGenerationStages | null): number {
    if (step == null) {
      return -1;
    }

    return VIDEO_GENERATION_ORDER.indexOf(step);
  }

  


  static getStepDurationSeconds(step: VideoGenerationStages): string {
    if (step in LoadingStates) {
      const stateData = LoadingStates[step];
      return stateData.duration;
    }

    console.error(`Invalid step: ${step}`);
    return 'Unknown duration'; // Provide a fallback duration
  }

}
