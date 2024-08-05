import { PopulatedUser } from '@/constants';

export const jsonStringToUser = (jsonString: string): PopulatedUser => {
  const userObject = JSON.parse(jsonString);

  const user: PopulatedUser = {
    id: userObject.id,
    email: userObject.email,
    free_credits_used: userObject.free_credits_used,
    created_at: userObject.created_at,
    subscription: undefined,
  };

  return user;
};
