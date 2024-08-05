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

  const [selectedVoice, setSelectedVoice] = useState(
    AI_VOICE_SELECT_OPTIONS[0]
  );
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



const generateThumbnail = async (data: CreateFormType) : Promise<string | undefined> => {
  const options = {
    method: 'POST',
    url: 'https://ai-text-to-image-generator-api.p.rapidapi.com/3D',
    headers: {
      'x-rapidapi-key': '76bc71515bmshbeb718a74ca628bp1a912djsnade9d7880480',
      'x-rapidapi-host': 'ai-text-to-image-generator-api.p.rapidapi.com',
      'Content-Type': 'application/json'
    },
    data: {
      inputs: data.prompt
    }
  };
  
  
    const res = await axios.request(options);
    console.log('Response from Text2Image Video API:',res.data);

    const imageURL = res.data.url;

    if (!imageURL) {
      throw new Error('Failed to retrieve video URL');
    }

    return imageURL;



}





  const generateVideo = async (data: CreateFormType): Promise<string | undefined> => {
    const helloWorldJson = {
      timeline: {
        soundtrack: {
          src: "https://s3-ap-southeast-2.amazonaws.com/shotstack-assets/music/moment.mp3",
          effect: "fadeOut"
        },
        background: "#000000",
        tracks: [
          {
            clips: [
              {
                asset: {
                  type: "text",
                  text: data.prompt,
                },
                start: 0,
                length: 30,
                transition: {
                  in: "fade",
                  out: "fade"
                }
              }
            ]
          }
        ]
      },
      output: {
        format: "mp4",
        size: {
          width: 1024,
          height: 576
        }
      }
    };
  
    try {
      console.log('Sending request to Shotstack API:', JSON.stringify(helloWorldJson, null, 2));



  
      const response = await axios.post('https://api.shotstack.io/edit/stage/render', helloWorldJson, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'pHGJlGjBmcTlNyK0lFbyfYJ2auw90uZJQyY3CvZS'
        }
      });
  
      console.log('Response from Shotstack Video API:', response.data);
  
      if (!response.data || !response.data.response || !response.data.response.id) {
        throw new Error('Invalid response from Shotstack API');
      }
  
      const renderId = response.data.response.id;
      let status = 'queued';
      let url;
  
      while (status !== 'done' && status !== 'failed') {
        const statusResponse = await axios.get(`https://api.shotstack.io/edit/stage/render/${renderId}`, {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'pHGJlGjBmcTlNyK0lFbyfYJ2auw90uZJQyY3CvZS'
          }
        });
  
        console.log('Polling response:', statusResponse.data);
  
        status = statusResponse.data.response.status;
  
        if (status === 'done') {
          url = statusResponse.data.response.url;
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
    } catch (error) {
      if (error.response) {
        console.error('Error response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.error('Error message:', error.message);
      }
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
          `You have reached your monthly token limit of ${UserService.getUserTokenLimit(
            user
          )}. Please upgrade your plan`
        );
  
        router.push('/pricing');
  
        setLoading(false);
  
        return;
      }
  
      const videoURL = await generateVideo(data);
      const imageURL = await generateThumbnail(data)
  
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
        thumbnail_url : imageURL
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
          <div className='mb-4 flex w-full items-center  justify-between'>
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
