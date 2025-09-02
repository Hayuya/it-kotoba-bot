import { createClient } from 'microcms-js-sdk';
import { TwitterApi } from 'twitter-api-v2';
import 'dotenv/config'; // dotenvをインポート

// --- microCMS クライアントの初期化 ---
const microcmsClient = createClient({
  serviceDomain: process.env.MICROCMS_SERVICE_DOMAIN,
  apiKey: process.env.MICROCMS_API_KEY,
});

// --- Twitter クライアントの初期化 ---
const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_KEY_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

// サイトのURL（実際のURLに合わせてください）
const siteUrl = process.env.SITE_URL || 'https://itkotoba.com';

/**
 * ランダムなIT用語を1件取得する関数
 */
async function getRandomTerm() {
  console.log('Fetching total count of terms...');
  const { totalCount } = await microcmsClient.get({
    endpoint: 'terms',
    queries: { limit: 0 },
  });

  if (totalCount === 0) {
    throw new Error('No terms found in microCMS.');
  }
  console.log(`Total terms: ${totalCount}`);

  const randomOffset = Math.floor(Math.random() * totalCount);
  console.log(`Generated random offset: ${randomOffset}`);

  const { contents } = await microcmsClient.get({
    endpoint: 'terms',
    queries: {
      limit: 1,
      offset: randomOffset,
      fields: 'title,description,slug,category.name',
    },
  });

  if (!contents || contents.length === 0) {
    throw new Error('Failed to fetch a random term.');
  }
  
  console.log('Successfully fetched random term:', contents[0].title);
  return contents[0];
}

/**
 * Xにツイートを投稿する関数
 */
async function postTweet(term) {
  const termUrl = `${siteUrl}/terms/${term.slug}`;
  
  // ツイート本文の組み立て
  let tweetText = `【今日のIT用語】\n『${term.title}』\n\n${term.description}\n\n`;
  
  // 文字数制限（280字）を考慮
  const footer = `\n詳しくはこちら👇\n${termUrl}\n\n#IT用語 #情報処理安全確保支援士 #${term.category.name}`;
  const availableLength = 280 - footer.length;
  
  if (tweetText.length > availableLength) {
    tweetText = tweetText.substring(0, availableLength - 3) + '...\n\n';
  }
  
  const finalTweet = tweetText + footer;

  console.log('Posting tweet...');
  console.log(finalTweet);
  
  try {
    const { data: createdTweet } = await twitterClient.v2.tweet(finalTweet);
    console.log('Tweet posted successfully!', `ID: ${createdTweet.id}`);
  } catch (error) {
    console.error('Error posting tweet:', error.message);
    if (error.data) console.error(JSON.stringify(error.data, null, 2));
    throw error;
  }
}

/**
 * メインの実行関数
 */
async function main() {
  try {
    const term = await getRandomTerm();
    await postTweet(term);
  } catch (error) {
    console.error('An error occurred:', error);
    process.exit(1);
  }
}

main();