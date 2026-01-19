export const DEFAULT_CONFIG = {
  excludePaths: [
    '**/__generated__/**',
    '**/*.snap',
    '**/dist/**',
    '**/build/**',
    '**/*.min.*',
    '**/*.map',
    '**/*.lock',
    '**/coverage/**',
    '**/*.png',
    '**/*.jpg',
    '**/*.jpeg',
    '**/*.gif',
    '**/*.svg',
  ],
  maxPatchLines: 400,
  maxPatchChars: 12000,
  domainMap: [
    {
      name: 'checkout',
      patterns: [
        'src/**/checkout/**',
        'src/**/payment/**',
        'src/**/tossPayments/**',
        'src/**/order/**',
      ],
    },
    {
      name: 'promotion',
      patterns: [
        'src/**/promotion/**',
        'src/**/coupon/**',
        'src/**/discount/**',
      ],
    },
    {
      name: 'content',
      patterns: ['src/**/feed/**', 'src/**/post/**', 'src/**/creator/**'],
    },
    {
      name: 'auth',
      patterns: ['src/**/auth/**', 'src/**/login/**', 'src/**/signup/**'],
    },
    {
      name: 'settings',
      patterns: ['src/**/settings/**', 'src/**/profile/**'],
    },
    {
      name: 'notification',
      patterns: ['src/**/notification/**', 'src/**/push/**'],
    },
    {
      name: 'analytics',
      patterns: [
        'src/**/analytics/**',
        'src/**/tracking/**',
        'src/**/metrics/**',
      ],
    },
    {
      name: 'feature-flag',
      patterns: [
        'src/**/featureFlags/**',
        'src/**/experiment/**',
        'src/**/abTest/**',
      ],
    },
    {
      name: 'i18n',
      patterns: ['src/**/locales/**', 'src/**/i18n/**'],
    },
  ],
  signalKeywords: [
    {
      name: 'pricing',
      keywords: [
        'price',
        'pricing',
        'discount',
        'coupon',
        'promo',
        'promotion',
        'fee',
        'commission',
        'rate',
        'amount',
      ],
    },
    {
      name: 'payment',
      keywords: [
        'payment',
        'checkout',
        'billing',
        'refund',
        'settlement',
        'toss',
        'card',
      ],
    },
    {
      name: 'policy',
      keywords: ['policy', 'terms', 'consent', 'agreement', 'privacy'],
    },
    {
      name: 'experiment',
      keywords: [
        'featureFlag',
        'feature_flag',
        'experiment',
        'abtest',
        'rollout',
      ],
    },
    {
      name: 'growth',
      keywords: [
        'signup',
        'onboarding',
        'retention',
        'activation',
        'conversion',
      ],
    },
    {
      name: 'notification',
      keywords: ['push', 'notification', 'fcm', 'apns', 'inbox'],
    },
  ],
  topPrCount: 8,
};
