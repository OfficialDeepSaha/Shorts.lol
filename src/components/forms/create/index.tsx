import { yupResolver } from '@hookform/resolvers/yup';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { RainbowBorderButton } from '@/components/buttons/RainbowBorderButton';
import {
  CreateFormType,
  stepOneSchema,
  stepTwoSchema,
  validationSchema,
} from './validationSchema';
import StyledInput, { StyledTextAreaTailwind } from '../input';
import Image from 'next/image';
import { TemplateCard } from './templateCard';
import { BiArrowBack } from 'react-icons/bi';
import { useRouter } from 'next/router';
import { TemplateStep } from './templateStep';
import { CreateScript } from './createScript';
import { AddAudio } from './addAudio';
import { useUser } from '@/contexts';
import { UserService } from '@/domain/services/userService';
import { addNewVideo } from '@/lib/supabase/newVideo';
import {
  AI_VOICE_DETAILS,
  AI_VOICE_SELECT_OPTIONS,
} from '@/constant/createVideo/voices';
import axios from 'axios';

const CreateForm: React.FC = () => {
  const router = useRouter();
  const { user } = useUser();
  const [step, setStep] = useState(0);

  const methods = useForm<CreateFormType>({
    resolver: yupResolver(validationSchema[step]) as any,
  });

  const { register, handleSubmit } = methods;

  const [selectedVoice, setSelectedVoice] = useState(AI_VOICE_SELECT_OPTIONS[0]);
  const [isSubtitles, setIsSubtitles] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleNext = async (data: CreateFormType) => {
    try {
      setLoading(true);
      await validationSchema[step].validate(data);
      setStep((prevStep) => prevStep + 1);
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      key: 0,
      value: <TemplateStep loading={loading} setStep={setStep} />,
      label: 'Choose a template',
    },
    {
      key: 1,
      value: <CreateScript loading={loading} />,
      label: 'Create your script',
    },
    {
      key: 2,
      value: (
        <AddAudio
          setSelectedVoice={setSelectedVoice}
          isSubtitles={isSubtitles}
          setIsSubtitles={setIsSubtitles}
          selectedVoice={selectedVoice}
          loading={loading}
        />
      ),
      label: 'Other features',
    },
  ];

  const generateThumbnail = async (data: CreateFormType): Promise<string | undefined> => {
    const options = {
      method: 'POST',
      url: 'https://ai-text-to-image-generator-api.p.rapidapi.com/realistic',
      headers: {
        'x-rapidapi-key': '76bc71515bmshbeb718a74ca628bp1a912djsnade9d7880480',
        'x-rapidapi-host': 'ai-text-to-image-generator-api.p.rapidapi.com',
        'Content-Type': 'application/json'
      },
      data: {
        inputs: data.prompt
      }
    };

    let attempts = 0;
    const maxAttempts = 5;
    toast.success('Generating Images...');

    while (attempts < maxAttempts) {
      try {
        const res = await axios.request(options);
        console.log('Response from Text2Image Video API:', res.data);
        const imageURL = res.data.url;
        if (!imageURL) {
          throw new Error('Failed to retrieve video URL');
        }
        return imageURL;
      } catch (error: any) {
        if (error.response && error.response.status === 429) {
          attempts++;
          console.log(`Rate limit exceeded, retrying in ${attempts * 2} seconds...`);
          await new Promise(resolve => setTimeout(resolve, attempts * 2000));
        } else {
          throw error;
        }
      }
    }

    throw new Error('Failed to generate thumbnail after multiple attempts');
  };

 




  const generateVideo = async (data: CreateFormType): Promise<string | undefined> => {
    try {
      console.log('Sending request to RunwayML API:');
      toast.success('Generating Video...')
      const response = await axios.post(
        'https://runwayml.p.rapidapi.com/generate/text',
        {
          text_prompt: data.prompt,
          model: 'gen3',
          width: 1344,
          height: 768,
          motion: 30,
          seed: 0,
          upscale: true,
          interpolate: true,
          callback_url: ''
        },
        {
          headers: {
            'x-rapidapi-key': '3d2d391436msh372e7b3970cb154p151b9cjsn2aff94a09828',
            'x-rapidapi-host': 'runwayml.p.rapidapi.com',
            'Content-Type': 'application/json'
          }
        }
      );
  
      console.log('Response from RunwayML Video API:', response.data);
  
      if (!response.data || !response.data.uuid) {
        throw new Error('Invalid response from RunwayML API');
      }
  
      const renderId = response.data.uuid;
      let status = 'queued';
      let url;
  
      while (status !== 'success' && status !== 'failed') {
        const statusResponse = await axios.get(`https://runwayml.p.rapidapi.com/status`, {
          params: {
            uuid: renderId
          },
          headers: {
            'x-rapidapi-key': '76bc71515bmshbeb718a74ca628bp1a912djsnade9d7880480',
            'x-rapidapi-host': 'runwayml.p.rapidapi.com'
          }
        });
  
        console.log('Polling response:', statusResponse.data);
  
        status = statusResponse.data.status;
  
        if (status === 'success') {
          url = statusResponse.data.url;
        } else if (status === 'failed') {
          throw new Error('Video rendering failed');
        } else {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
  
      if (!url) {
        throw new Error('Failed to retrieve video URL');
      }
  
      return url;
    } catch (error: any) {
      console.error('Error response:', JSON.stringify(error, null, 2));
      return undefined;
    }
  };
  



  const handleSubmitAsync = async (data: CreateFormType) => {
    if (step !== steps.length - 1) {
      await handleNext(data);
      return;
    }
    setLoading(true);

    try {
      if (!user?.id) {
        throw new Error('User not found');
      }

      if (UserService.hasUserReachedTokenLimit(user)) {
        toast.error(
          `You have reached your monthly token limit of ${UserService.getUserTokenLimit(user)}. Please upgrade your plan`
        );
        router.push('/pricing');
        setLoading(false);
        return;
      }

      const videoURL = await generateVideo(data);
      const imageURL = await generateThumbnail(data);

      if (!videoURL) {
        throw new Error('Failed to generate video URL');
      }

      const video_id = await addNewVideo({
        userID: user.id,
        prompt: data.prompt,
        voiceID: AI_VOICE_DETAILS[selectedVoice.value].elevenLabsId,
        endingText: data.endingText,
        isScript: data.isScript,
        script: data.script,
        url: videoURL,
        thumbnail_url: imageURL
      });

      await axios.post('/api/queueOrder', {
        video_id,
      });

      toast.success('Video created!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message);
      toast.error('Please contact team@shorts.lol');
      setLoading(false);
      return;
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(handleSubmitAsync)}>
        <div className='mx-auto w-full max-w-7xl px-2 sm:px-6 lg:px-8'>
          <div className='mb-4 flex w-full items-center justify-between'>
            <BiArrowBack
              className='h-6 w-6 cursor-pointer text-gray-600 hover:text-black'
              onClick={() => {
                if (step > 0) {
                  setStep(step - 1);
                } else {
                  router.push('/dashboard');
                }
              }}
            />
            <h2>{steps[step].label} ⚡️</h2>
            <div />
          </div>
          <div>{steps[step].value}</div>
        </div>
      </form>
    </FormProvider>
  );
};

export default CreateForm;
