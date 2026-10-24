import 'dotenv/config';
import { createHash, randomUUID } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { ContentStatus, ContentType, PrismaClient, ReactionType, Role, SubscriptionType } from './generated/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required to seed the database');
if (process.env.NODE_ENV === 'production') {
  throw new Error('Demo seed data cannot be applied with NODE_ENV=production');
}

const database = new URL(connectionString);
if (!['postgresql:', 'postgres:'].includes(database.protocol)) {
  throw new Error('The seed requires a PostgreSQL DATABASE_URL');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

function seedId(key: string) {
  const hash = createHash('sha256').update(`content-hub-demo:${key}`).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

const authors = [
  {
    key: 'maya',
    email: 'maya.editor@content-hub.example',
    username: 'Maya Chen',
    bio: 'Editor exploring science, nature, and the way ideas travel.',
    role: Role.EDITOR,
  },
  {
    key: 'jordan',
    email: 'jordan.editor@content-hub.example',
    username: 'Jordan Ellis',
    bio: 'Writer and producer interested in cities, sound, and design.',
    role: Role.EDITOR,
  },
  {
    key: 'sam',
    email: 'sam.reader@content-hub.example',
    username: 'Sam Rivera',
    bio: 'Reader with a soft spot for curious questions.',
    role: Role.USER,
  },
] as const;

const categories = [
  { key: 'science', name: 'Science' },
  { key: 'space', name: 'Space', parent: 'science' },
  { key: 'culture', name: 'Culture' },
  { key: 'technology', name: 'Technology' },
  { key: 'nature', name: 'Nature' },
] as const;

const tags = ['Discovery', 'Space', 'Cities', 'Design', 'Audio', 'Sustainability', 'Research', 'People'];

const sources = [
  { key: 'journal', name: 'Content Hub Journal', url: 'https://example.org/' },
  { key: 'studio', name: 'Content Hub Studio', url: 'https://example.com/' },
] as const;

type Story = {
  key: string;
  type: ContentType;
  title: string;
  description: string;
  body: string;
  author: 'maya' | 'jordan';
  category: 'science' | 'space' | 'culture' | 'technology' | 'nature';
  tags: string[];
  source: 'journal' | 'studio';
  status?: ContentStatus;
};

const stories: Story[] = [
  {
    key: 'better-questions',
    type: ContentType.ARTICLE,
    title: 'The art of asking better questions',
    description: 'A practical look at curiosity and the questions that open a conversation.',
    body: 'A useful question gives the other person room to think. It invites a story instead of demanding a short answer.\n\nStart with what you genuinely want to understand, listen carefully, and let the next question grow from the answer.',
    author: 'maya',
    category: 'culture',
    tags: ['People', 'Discovery'],
    source: 'journal',
  },
  {
    key: 'night-sky',
    type: ContentType.VIDEO,
    title: 'Finding your way around the night sky',
    description: 'A visual introduction to the patterns visible after sunset.',
    body: 'Begin with the brightest points of light and notice how their positions change through the evening.\n\nThis sample video entry introduces an observing routine that works from a balcony, a park, or a quiet street.',
    author: 'maya',
    category: 'space',
    tags: ['Space', 'Discovery'],
    source: 'studio',
  },
  {
    key: 'city-at-dawn',
    type: ContentType.PODCAST,
    title: 'A city before it wakes',
    description: 'A conversation about the sounds and rhythms of early urban mornings.',
    body: 'Before traffic fills the streets, a city has a different rhythm. We talk about the people who work at dawn and the sounds that mark the start of a day.\n\nThis is a sample podcast entry for exploring the Content Hub catalog.',
    author: 'jordan',
    category: 'culture',
    tags: ['Cities', 'Audio', 'People'],
    source: 'studio',
  },
  {
    key: 'community-gardens',
    type: ContentType.NEWS,
    title: 'Community gardens gain new ground',
    description: 'Neighborhood growers are finding more ways to share space and knowledge.',
    body: 'Local gardening groups are experimenting with shared plots and open workshops. Their work turns small unused spaces into places for neighbors to meet.\n\nThis fictional update is part of the Content Hub demo dataset.',
    author: 'jordan',
    category: 'nature',
    tags: ['Cities', 'Sustainability'],
    source: 'journal',
  },
  {
    key: 'deep-ocean',
    type: ContentType.ARTICLE,
    title: 'What the deep ocean can teach us',
    description: 'Life below the sunlit surface offers a different view of adaptation.',
    body: 'The deep ocean is difficult to observe, yet every expedition adds a small piece to the picture. Creatures living there cope with pressure, cold, and darkness in remarkable ways.\n\nCareful observation is often the beginning of a bigger question.',
    author: 'maya',
    category: 'science',
    tags: ['Research', 'Discovery'],
    source: 'journal',
  },
  {
    key: 'street-design',
    type: ContentType.VIDEO,
    title: 'How a street becomes a place',
    description: 'Looking at the details that make public space welcoming.',
    body: 'A street is more than a way to travel. Seating, shade, crossing points, and room to pause shape how people use it.\n\nThis sample video entry follows those details through a walkable neighborhood.',
    author: 'jordan',
    category: 'culture',
    tags: ['Cities', 'Design'],
    source: 'studio',
  },
  {
    key: 'quiet-technology',
    type: ContentType.PODCAST,
    title: 'Technology that stays out of the way',
    description: 'Designing tools that help without demanding attention.',
    body: 'The best tool can feel almost invisible when it supports a task without interrupting it. In this sample conversation, we discuss small design choices that make software calmer to use.',
    author: 'jordan',
    category: 'technology',
    tags: ['Design', 'Audio'],
    source: 'studio',
  },
  {
    key: 'meteor-watch',
    type: ContentType.NEWS,
    title: 'A new season for sky watchers',
    description: 'Even a short evening outdoors can become an observation session.',
    body: 'Clear skies make it easier to notice changes above us. A simple plan, warm clothing, and patience are enough to begin.\n\nThis fictional news entry demonstrates the catalog’s news format.',
    author: 'maya',
    category: 'space',
    tags: ['Space', 'Discovery'],
    source: 'journal',
  },
  {
    key: 'small-museums',
    type: ContentType.ARTICLE,
    title: 'Why small museums matter',
    description: 'Local collections preserve stories that are easy to overlook.',
    body: 'A small collection can tell a large story when it stays close to the people and places that shaped it. Labels, objects, and community memory work together to make history tangible.',
    author: 'jordan',
    category: 'culture',
    tags: ['People', 'Design'],
    source: 'journal',
  },
  {
    key: 'forest-patterns',
    type: ContentType.VIDEO,
    title: 'Patterns in a living forest',
    description: 'An invitation to notice light, growth, and change on a familiar trail.',
    body: 'A forest changes from hour to hour. Light moves, birds call, and plants respond to the weather.\n\nThis sample video entry encourages slow observation rather than a quick checklist.',
    author: 'maya',
    category: 'nature',
    tags: ['Sustainability', 'Discovery'],
    source: 'studio',
  },
  {
    key: 'research-stories',
    type: ContentType.PODCAST,
    title: 'The stories behind research',
    description: 'Researchers explain the false starts and surprises behind a result.',
    body: 'Published results rarely show every question that came before them. This sample conversation looks at how curiosity, collaboration, and revision shape research over time.',
    author: 'maya',
    category: 'science',
    tags: ['Research', 'Audio', 'People'],
    source: 'studio',
  },
  {
    key: 'repair-cafes',
    type: ContentType.NEWS,
    title: 'Repair cafés bring neighbors together',
    description: 'Shared skills can keep useful objects in service for longer.',
    body: 'Volunteer repair events offer a place to learn, exchange tools, and give everyday objects another chance.\n\nThis fictional update illustrates how local news appears in Content Hub.',
    author: 'jordan',
    category: 'technology',
    tags: ['Sustainability', 'People'],
    source: 'journal',
  },
  {
    key: 'moon-map',
    type: ContentType.ARTICLE,
    title: 'Reading a map of the Moon',
    description: 'A beginner-friendly guide to the features visible through binoculars.',
    body: 'The Moon rewards repeated visits. Craters, dark plains, and shifting shadows give familiar terrain a new shape each night.\n\nBegin with one feature, sketch what you see, and compare it on your next clear evening.',
    author: 'maya',
    category: 'space',
    tags: ['Space', 'Research'],
    source: 'journal',
  },
  {
    key: 'making-a-zine',
    type: ContentType.VIDEO,
    title: 'Making a small neighborhood zine',
    description: 'From interviews and sketches to a folded paper publication.',
    body: 'A zine can start with a few pages and a shared question. Gather stories, make room for different voices, and print a small run to see what conversations it starts.',
    author: 'jordan',
    category: 'culture',
    tags: ['Design', 'Cities'],
    source: 'studio',
  },
  {
    key: 'river-listening',
    type: ContentType.PODCAST,
    title: 'Listening to a river',
    description: 'How waterways connect ecology, weather, and city life.',
    body: 'A river carries many stories at once: seasonal change, human use, and the movement of plants and animals. This sample episode follows those connections along one urban waterway.',
    author: 'maya',
    category: 'nature',
    tags: ['Audio', 'Sustainability'],
    source: 'studio',
  },
  {
    key: 'open-science',
    type: ContentType.NEWS,
    title: 'New ways to share science openly',
    description: 'Community events make research easier to discuss beyond the lab.',
    body: 'Public talks and shared materials help more people ask questions about research.\n\nThis fictional report completes the demo catalog’s four content formats.',
    author: 'maya',
    category: 'science',
    tags: ['Research', 'People'],
    source: 'journal',
  },
  {
    key: 'draft-interview',
    type: ContentType.ARTICLE,
    title: 'Interview notes in progress',
    description: 'An unpublished interview draft.',
    body: 'These notes are private until an editor publishes the story.',
    author: 'jordan',
    category: 'culture',
    tags: ['People'],
    source: 'journal',
    status: ContentStatus.DRAFT,
  },
  {
    key: 'draft-film',
    type: ContentType.VIDEO,
    title: 'Unfinished city film',
    description: 'An unpublished video draft.',
    body: 'The final edit is still in progress.',
    author: 'jordan',
    category: 'culture',
    tags: ['Cities'],
    source: 'studio',
    status: ContentStatus.DRAFT,
  },
];

async function main() {
  const demoPassword = process.env.SEED_DEMO_PASSWORD;
  if (demoPassword && demoPassword.length < 12) {
    throw new Error('SEED_DEMO_PASSWORD must have at least 12 characters');
  }
  const passwordHash = await bcrypt.hash(demoPassword ?? randomUUID(), 10);

  await prisma.$transaction(
    async (tx) => {
      for (const author of authors) {
        await tx.user.upsert({
          where: { id: seedId(`user:${author.key}`) },
          update: demoPassword ? { password: passwordHash } : {},
          create: {
            id: seedId(`user:${author.key}`),
            email: author.email,
            username: author.username,
            bio: author.bio,
            role: [author.role],
            password: passwordHash,
          },
        });
      }

      for (const category of categories) {
        await tx.category.upsert({
          where: { id: seedId(`category:${category.key}`) },
          update: {},
          create: {
            id: seedId(`category:${category.key}`),
            name: category.name,
            ...('parent' in category ? { parent: { connect: { id: seedId(`category:${category.parent}`) } } } : {}),
          },
        });
      }

      for (const name of tags) {
        await tx.tag.upsert({ where: { name }, update: {}, create: { name } });
      }

      for (const source of sources) {
        await tx.source.upsert({
          where: { id: seedId(`source:${source.key}`) },
          update: {},
          create: { id: seedId(`source:${source.key}`), name: source.name, url: source.url },
        });
      }

      for (const [index, story] of stories.entries()) {
        await tx.content.upsert({
          where: { id: seedId(`content:${story.key}`) },
          update: {},
          create: {
            id: seedId(`content:${story.key}`),
            title: story.title,
            description: story.description,
            body: story.body,
            type: story.type,
            status: story.status ?? ContentStatus.PUBLISHED,
            publishedAt:
              story.status === ContentStatus.DRAFT
                ? null
                : new Date(`2026-10-${String(18 - index).padStart(2, '0')}T09:00:00.000Z`),
            author: { connect: { id: seedId(`user:${story.author}`) } },
            category: { connect: { id: seedId(`category:${story.category}`) } },
            source: { connect: { id: seedId(`source:${story.source}`) } },
            tags: { connect: story.tags.map((name) => ({ name })) },
          },
        });
      }

      const firstStory = seedId('content:better-questions');
      const secondStory = seedId('content:night-sky');
      const reader = seedId('user:sam');
      await tx.comment.upsert({
        where: { id: seedId('comment:question') },
        update: {},
        create: {
          id: seedId('comment:question'),
          contentId: firstStory,
          userId: reader,
          text: 'What is one question you keep returning to?',
        },
      });
      await tx.comment.upsert({
        where: { id: seedId('comment:reply') },
        update: {},
        create: {
          id: seedId('comment:reply'),
          contentId: firstStory,
          userId: seedId('user:maya'),
          parentId: seedId('comment:question'),
          text: 'I often ask what a familiar idea might be missing.',
        },
      });
      await tx.reaction.upsert({
        where: { userId_contentId_type: { userId: reader, contentId: firstStory, type: ReactionType.LIKE } },
        update: {},
        create: { userId: reader, contentId: firstStory, type: ReactionType.LIKE },
      });
      await tx.reaction.upsert({
        where: { userId_contentId_type: { userId: reader, contentId: secondStory, type: ReactionType.SAVE } },
        update: {},
        create: { userId: reader, contentId: secondStory, type: ReactionType.SAVE },
      });
      await tx.view.upsert({
        where: { id: seedId('view:first') },
        update: {},
        create: {
          id: seedId('view:first'),
          contentId: firstStory,
          userId: reader,
          requestId: seedId('view-request:first'),
        },
      });
      await tx.readingHistory.upsert({
        where: { userId_contentId: { userId: reader, contentId: firstStory } },
        update: {},
        create: { userId: reader, contentId: firstStory },
      });
      await tx.view.upsert({
        where: { id: seedId('view:second') },
        update: {},
        create: {
          id: seedId('view:second'),
          contentId: secondStory,
          userId: reader,
          requestId: seedId('view-request:second'),
        },
      });
      await tx.readingHistory.upsert({
        where: { userId_contentId: { userId: reader, contentId: secondStory } },
        update: {},
        create: { userId: reader, contentId: secondStory },
      });
      await tx.subscription.upsert({
        where: { id: seedId('subscription:maya') },
        update: {},
        create: {
          id: seedId('subscription:maya'),
          userId: reader,
          type: SubscriptionType.AUTHOR,
          targetId: seedId('user:maya'),
        },
      });
    },
    { timeout: 30_000 },
  );

  console.log(
    `Demo seed ready in ${database.hostname}/${database.pathname.slice(1)}: ` +
      `${authors.length} users, ${categories.length} categories, ${tags.length} tags, ` +
      `${sources.length} sources, ${stories.length} content items (${stories.filter((story) => story.status !== ContentStatus.DRAFT).length} published).`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
