import { PopulatedUser, SUBSCRIPTIONS_TABLE, USERS_TABLE } from '@/constants';
import { supabase } from '../supabaseClient';


export const getUser = async (
  userId: string,
  email?: string
): Promise<PopulatedUser> => {
  console.log('Fetching user with ID:', userId);

  // Fetch user data
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (userError || !userData) {
    console.error('Error fetching user:', userError);
    throw new Error('User not found');
  }

  console.log('User data:', userData);

  // Fetch the most recent subscription
  const { data: subscriptionData, error: subscriptionError } = await supabase
    .from(SUBSCRIPTIONS_TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: false })
    .limit(1);

    console.log('Subscription data fetched!')

  if (subscriptionError) {
    console.error('Error fetching subscription:', subscriptionError);
  }

  if (email) {
    userData.email = email;
  }

  if (subscriptionData && subscriptionData.length > 0) {
    userData.subscription = subscriptionData[0];
  }

  return userData;
};
