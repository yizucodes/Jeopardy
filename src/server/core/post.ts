import { getWordOfTheDay } from './words';
import { getRedis } from '@devvit/redis';

type PostConfig = {
  wordOfTheDay: string;
};

const getPostConfigKey = (postId: string) => `post_config:${postId}` as const;

export const postConfigMaybeGet = async ({
  postId,
}: {
  postId: string;
}): Promise<PostConfig | undefined> => {
  const config = await getRedis().get(getPostConfigKey(postId));
  return config ? JSON.parse(config) : undefined;
};

export const postConfigGet = async ({ postId }: { postId: string }): Promise<PostConfig> => {
  const config = await postConfigMaybeGet({ postId });
  if (!config) throw new Error('Post config not found');
  return config;
};

export const postConfigSet = async ({
  postId,
  config,
}: {
  postId: string;
  config: Partial<PostConfig>;
}): Promise<void> => {
  await getRedis().set(getPostConfigKey(postId), JSON.stringify(config));
};

export const postConfigNew = async ({ postId }: { postId: string }): Promise<void> => {
  const wordOfTheDay = getWordOfTheDay();

  if (!wordOfTheDay) {
    throw new Error('No word of the day found');
  }

  await getRedis().set(
    getPostConfigKey(postId),
    JSON.stringify({ wordOfTheDay } satisfies PostConfig)
  );
};
