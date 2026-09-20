import type { ContentIdea } from '@/types';

/** Backlog ideas per channel. Promoting one creates a project at Idea stage. */
export const CONTENT_IDEAS: ContentIdea[] = [
  { id: 'id_ai_1', channelId: 'ch_ai_smb', title: 'Ten minutes with your own data: a retrieval demo without the jargon', angle: 'Load one folder of invoices, ask three questions, show what it gets wrong.', format: 'tutorial', languages: ['en', 'hi'], confidence: 4, createdOn: '2026-08-28', source: 'Comment thread on the quotation video' },
  { id: 'id_ai_2', channelId: 'ch_ai_smb', title: 'The GST-return workflow we would not automate', angle: 'Argue against automating a compliance step and explain the liability.', format: 'explainer', languages: ['en'], confidence: 3, createdOn: '2026-09-02' },
  { id: 'id_ai_3', channelId: 'ch_ai_smb', title: 'Prompt files your whole team can share', angle: 'Version-controlled prompts as an ordinary operations document.', format: 'tutorial', languages: ['en', 'hi'], confidence: 4, createdOn: '2026-09-11' },

  { id: 'id_off_1', channelId: 'ch_office', title: 'Pivot tables explained in one real dataset', angle: 'One sales export, six questions, no theory.', format: 'tutorial', languages: ['en', 'hi'], confidence: 5, createdOn: '2026-08-30' },
  { id: 'id_off_2', channelId: 'ch_office', title: 'What to say when you are handed an impossible deadline', angle: 'Three scripts, each with the trade-off stated out loud.', format: 'explainer', languages: ['en', 'hi'], confidence: 4, createdOn: '2026-09-05' },
  { id: 'id_off_3', channelId: 'ch_office', title: 'The one-page handover document', angle: 'A template for leaving a role without leaving chaos.', format: 'tutorial', languages: ['en'], confidence: 3, createdOn: '2026-09-14' },

  { id: 'id_eng_1', channelId: 'ch_english', title: 'Articles: a, an, the — the three-question test', angle: 'A decision tree Hindi speakers can run in a second.', format: 'tutorial', languages: ['hi', 'en'], confidence: 5, createdOn: '2026-08-25' },
  { id: 'id_eng_2', channelId: 'ch_english', title: 'Phone English: taking a message correctly', angle: 'Six phrases, one role-play, repeated three times.', format: 'tutorial', languages: ['hi', 'en'], confidence: 4, createdOn: '2026-09-03' },
  { id: 'id_eng_3', channelId: 'ch_english', title: 'Silent letters and where they hide', angle: 'Twenty common words, grouped by the pattern.', format: 'listicle', languages: ['hi', 'en'], confidence: 3, createdOn: '2026-09-12' },

  { id: 'id_brand_1', channelId: 'ch_brands', title: 'The rebrand that cost more than the acquisition', angle: 'Trace the spend through the filings, not the press release.', format: 'case_study', languages: ['en'], confidence: 4, createdOn: '2026-08-21' },
  { id: 'id_brand_2', channelId: 'ch_brands', title: 'Two founders, one trademark, twelve years of court', angle: 'A documented dispute told entirely from judgments.', format: 'story', languages: ['en', 'hi'], confidence: 4, createdOn: '2026-09-07' },
  { id: 'id_brand_3', channelId: 'ch_brands', title: 'How a regional dairy beat national distribution', angle: 'Logistics as the whole story.', format: 'case_study', languages: ['en', 'hi'], confidence: 5, createdOn: '2026-09-15' },

  { id: 'id_growth_1', channelId: 'ch_growth', title: 'The difference between rest and distraction', angle: 'Two categories people collapse into one, with the evidence for each.', format: 'explainer', languages: ['en', 'hi'], confidence: 4, createdOn: '2026-08-27' },
  { id: 'id_growth_2', channelId: 'ch_growth', title: 'Goals that survive a bad month', angle: 'Designing for interruption rather than for streaks.', format: 'explainer', languages: ['en', 'hi'], confidence: 3, createdOn: '2026-09-09' },
  { id: 'id_growth_3', channelId: 'ch_growth', title: 'What "burnout" means clinically, and what it does not', angle: 'The diagnostic definition versus the everyday one.', format: 'explainer', languages: ['en'], confidence: 5, createdOn: '2026-09-16' },

  { id: 'id_rel_1', channelId: 'ch_relationships', title: 'Repair attempts: the smallest unit of a working relationship', angle: 'Clinical framing of de-escalation behaviours.', format: 'explainer', languages: ['en', 'hi'], confidence: 4, createdOn: '2026-08-29' },
  { id: 'id_rel_2', channelId: 'ch_relationships', title: 'Money conversations that are actually about safety', angle: 'Financial conflict as an attachment question.', format: 'explainer', languages: ['en'], confidence: 3, createdOn: '2026-09-10' },
  { id: 'id_rel_3', channelId: 'ch_relationships', title: 'What the research says about long-distance relationships', angle: 'Prevalence, outcomes and the limits of the studies.', format: 'explainer', languages: ['en', 'hi'], confidence: 4, createdOn: '2026-09-17' },

  { id: 'id_cri_1', channelId: 'ch_cricket', title: 'The left-arm angle: why it still troubles right-handers', angle: 'Release-point geometry, animated.', format: 'explainer', languages: ['en', 'hi'], confidence: 5, createdOn: '2026-08-24' },
  { id: 'id_cri_2', channelId: 'ch_cricket', title: 'Powerplay field restrictions, drawn properly', angle: 'Every restriction as a diagram with the rule text beside it.', format: 'explainer', languages: ['en', 'hi'], confidence: 4, createdOn: '2026-09-06' },
  { id: 'id_cri_3', channelId: 'ch_cricket', title: 'When declaring early actually pays', angle: 'Historical outcomes by lead and overs remaining.', format: 'case_study', languages: ['en'], confidence: 3, createdOn: '2026-09-13' },

  { id: 'id_pet_1', channelId: 'ch_pets', title: 'Why cats knock things off tables', angle: 'What the ethology literature actually supports.', format: 'explainer', languages: ['en', 'hi'], confidence: 5, createdOn: '2026-08-26' },
  { id: 'id_pet_2', channelId: 'ch_pets', title: 'Summer heat and short-nosed breeds in Indian cities', angle: 'Climate-specific risk with veterinary guidance.', format: 'explainer', languages: ['en', 'hi'], confidence: 4, createdOn: '2026-09-04' },
  { id: 'id_pet_3', channelId: 'ch_pets', title: 'Introducing a second cat without a fight', angle: 'A staged protocol over three weeks.', format: 'tutorial', languages: ['en'], confidence: 4, createdOn: '2026-09-18' },

  { id: 'id_mys_1', channelId: 'ch_mystery', title: 'धुंध में तीसरा घर — एपिसोड 4', angle: 'गवाह का बयान बदलता है और तारीख़ फिर से हिल जाती है।', format: 'story', languages: ['hi'], confidence: 5, createdOn: '2026-09-08' },
  { id: 'id_mys_2', channelId: 'ch_mystery', title: 'नई सीरीज़: रेलवे कॉलोनी का आख़िरी क्वार्टर', angle: 'एक बंद रेलवे कॉलोनी, छह एपिसोड, नया किरदार।', format: 'story', languages: ['hi'], confidence: 3, createdOn: '2026-09-14' },
  { id: 'id_mys_3', channelId: 'ch_mystery', title: 'एक एपिसोड की कहानी: आख़िरी बस', angle: 'स्टैंडअलोन एपिसोड, एक ही रात में।', format: 'story', languages: ['hi'], confidence: 4, createdOn: '2026-09-19' },

  { id: 'id_kid_1', channelId: 'ch_kids', title: 'Tumbletail and the Wobbly Bridge', angle: 'Idea: asking for help is not the same as giving up.', format: 'story', languages: ['en', 'hi'], confidence: 4, createdOn: '2026-09-01' },
  { id: 'id_kid_2', channelId: 'ch_kids', title: 'The Day Nobody Was Hungry', angle: 'Idea: a plan can change and still be a good plan.', format: 'story', languages: ['en', 'hi'], confidence: 3, createdOn: '2026-09-11' },
  { id: 'id_kid_3', channelId: 'ch_kids', title: 'Counting Acorns with Tumbletail', angle: 'Idea: counting is a game you can play anywhere.', format: 'short', languages: ['en', 'hi'], confidence: 4, createdOn: '2026-09-19' },
];
