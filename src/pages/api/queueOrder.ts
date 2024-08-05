// pages/api/queueOrder.ts

import AWS from 'aws-sdk';
import type { NextApiRequest, NextApiResponse } from 'next';

import getServerConfig from '@/lib/config/serverConfig';

// Configure AWS SDK
AWS.config.update({
  accessKeyId: getServerConfig().awsAccessKeyID,
  secretAccessKey: getServerConfig().awsSecretKeyID,
  region: getServerConfig().awsRegion,
});

const sqs = new AWS.SQS();
const queueURL = getServerConfig().awsQueueURL;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).end(); // Method Not Allowed
  }

  const { video_id } = req.body;

  console.log('videoId', video_id);
  console.log("AWS SQS Working")

  if (!video_id) {
    return res.status(400).json({ error: 'Missing video ID' }); // Bad Request
  }

  const params = {
    MessageBody: JSON.stringify({ videoId: video_id }),
    QueueUrl: queueURL,
  };

  try {
    // Use promisified version of SQS sendMessage
    const data = await sqs.sendMessage(params).promise();
    console.log(data.$response);
    return res.status(200).json({ messageId: data.MessageId });
   
  } catch (err) {
    console.error('Error sending message to SQS', err);
    return res.status(500).json({ error: 'Failed to queue order' }); // Internal Server Error
  }
}
