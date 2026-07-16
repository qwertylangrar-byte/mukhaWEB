'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type Lang = 'ru' | 'en'

export const LANG_COOKIE = 'lang'

/* ------------------------------------------------------------------ */
/* Dictionaries                                                        */
/* ------------------------------------------------------------------ */

const ru = {
  common: {
    copy: 'Копировать',
    copied: 'Скопировано',
    close: 'Закрыть',
    retry: 'Повторить',
    account: 'Аккаунт',
    logout: 'Выйти',
    language: 'Language',
  },
  nav: {
    shop: 'Магазин',
    orders: 'Покупки',
    topup: 'Пополнение',
    referral: 'Рефералы',
    about: 'О нас',
    sections: 'Разделы',
    loginTg: 'Войти через Telegram',
  },
  landing: {
    badge: 'Отлежавшиеся Telegram-аккаунты',
    title: 'Магазин Telegram-аккаунтов с',
    titleAccent: 'мгновенной выдачей',
    subtitle:
      'Покупайте аккаунты по странам поштучно или оптом. Session + Tdata и коды входа — всё в одном личном кабинете, с балансом, общим с ботом.',
    browseCatalog: 'Смотреть каталог',
    featuresTitle: 'Всё для быстрой и безопасной покупки',
    featuresSub: 'Те же возможности, что и в боте, но в удобном веб-интерфейсе.',
    features: [
      {
        title: 'Аккаунты по странам',
        text: 'Большой каталог отлежавшихся Telegram-аккаунтов с гибким выбором страны и количества.',
      },
      {
        title: 'Мгновенная выдача',
        text: 'Session + Tdata приходят сразу после оплаты с баланса — без ожидания и ручной обработки.',
      },
      {
        title: 'Коды входа онлайн',
        text: 'Запрашивайте код авторизации прямо на сайте в один клик, когда он вам нужен.',
      },
      {
        title: 'Криптооплата',
        text: 'Пополняйте баланс через CryptoBot, Heleket или OxaPay — USDT, BTC, ETH и другие монеты.',
      },
      {
        title: 'Единый баланс',
        text: 'Баланс синхронизирован с ботом: пополняете где угодно — тратите где угодно.',
      },
      {
        title: 'Вход через Telegram',
        text: 'Никаких паролей. Авторизация проходит через вашего бота — быстро и безопасно.',
      },
    ],
    howTitle: 'Как это работает',
    howSub: 'Четыре шага от входа до готового аккаунта.',
    steps: [
      {
        title: 'Войдите через Telegram',
        text: 'Нажмите «Войти» и подтвердите вход в боте одним сообщением.',
      },
      {
        title: 'Пополните баланс',
        text: 'Пополнение зачисляется и на сайте, и в боте одновременно.',
      },
      {
        title: 'Выберите страну',
        text: 'Откройте каталог, выберите страну и количество аккаунтов.',
      },
      {
        title: 'Получите аккаунты',
        text: 'Данные и коды входа доступны сразу в личном кабинете.',
      },
    ],
    ctaTitle: 'Готовы начать?',
    ctaText:
      'Войдите через Telegram — регистрация происходит автоматически при первом входе.',
    footerSync: 'Баланс и аккаунты синхронизированы с Telegram-ботом',
  },
  login: {
    title: 'Вход через Telegram',
    text: 'Авторизация проходит прямо в боте. Никаких паролей — ваш баланс и покупки те же, что и в Telegram.',
    waiting: 'Ожидаем подтверждение в боте...',
    openBot: 'Откройте Telegram и нажмите «Start» в боте. Если бот не открылся —',
    followLink: 'перейдите по ссылке',
    tryAgain: 'попробуйте ещё раз',
    loggingIn: 'Входим...',
    secure: 'Безопасный вход. Мы не запрашиваем ваш пароль от Telegram.',
    startFailed: 'Не удалось начать вход',
    timedOut: 'Время ожидания истекло. Попробуйте ещё раз.',
    codeExpired: 'Код входа истёк. Попробуйте ещё раз.',
    loginError: 'Ошибка входа',
  },
  shop: {
    heading: 'Магазин',
    sub: 'Выберите страну — аккаунты выдаются мгновенно после оплаты с баланса.',
    searchPlaceholder: 'Поиск страны...',
    searchLabel: 'Поиск страны',
    sortLabel: 'Сортировка каталога',
    sortPopular: 'По популярности',
    sortCheap: 'Сначала дешевле',
    sortExpensive: 'Сначала дороже',
    loading: 'Загружаем каталог...',
    unavailable: 'Каталог временно недоступен',
    connError: 'Ошибка соединения с ботом.',
    nothing: 'Ничего не найдено.',
    inStock: (n: number) => `В наличии: ${n}`,
    outOfStock: 'Нет в наличии',
  },
  purchase: {
    stockLine: (n: number, price: string) =>
      `В наличии ${n} шт. · ${price} за аккаунт`,
    single: 'Поштучно',
    bulk: 'Оптом',
    quantity: 'Количество',
    total: 'Итого',
    buyFor: (price: string) => `Купить за ${price}`,
    processing: 'Обработка...',
    preparingArchive: 'Готовим архив…',
    dontClosePage: 'Не закрывайте страницу',
    archivePreparingNote:
      '— архив с аккаунтами готовится. Скачать его также можно будет в разделе «Покупки».',
    purchased: 'Покупка выполнена.',
    enterNumberNote:
      'Введите этот номер в официальном клиенте Telegram (с компьютера или через Nicegram на телефоне). Нажимайте «Получить код»',
    onlyAfter: 'только после того',
    codeSentSuffix: ', как Telegram показал, что код отправлен.',
    loginCode: 'Код входа:',
    waitingCode: 'Ждём код от Telegram…',
    secondsLeft: (s: number) => `Осталось до ${s} с. Не закрывайте страницу.`,
    getCode: 'Получить код',
    codeError: 'Покупка завершилась ошибкой — код недоступен.',
    codeTimeout:
      'Код не пришёл за 120 секунд. Убедитесь, что вы ввели номер в Telegram и появилось «код отправлен», затем нажмите «Повторить».',
    downloadArchive: 'Скачать архив с аккаунтами (TData + Session)',
    archiveLater: 'Архив ещё готовится — ссылка появится в разделе «Покупки».',
    goToOrders: 'Перейти к покупкам',
    buyFailed: 'Не удалось купить',
    warnRecord: 'Обязательно включите запись экрана перед входом в аккаунт.',
    warnRecordSuffix:
      'Это поможет получить замену в случае непредвиденных обстоятельств.',
    deviceNote1: 'Вход — по коду из Telegram.',
    deviceNote2: 'Заходите только с компьютера.',
    deviceNote3: 'На телефоне — только через нативное приложение, например',
    deviceNote4: '(обычный официальный клиент на телефоне не подходит).',
    bulkNote1: 'Оптом можно купить даже',
    bulkNote2: '1 штуку',
    bulkNote3: '. Выдача — в формате',
    bulkNote4: '(архивом).',
    recsTitle: 'Рекомендации по безопасности аккаунта',
    steps: [
      {
        title: 'Покупка',
        text: 'Нажмите кнопку «Купить». Вход в аккаунт выполняется по коду из Telegram. Заходите только с компьютера; на телефоне — только через нативное приложение, например Nicegram.',
      },
      {
        title: 'Авторизация',
        text: 'Откройте официальный клиент Telegram и войдите по выданному номеру телефона. Telegram запросит код подтверждения.',
      },
      {
        title: 'Получение кода',
        text: 'Сначала введите номер в Telegram и дождитесь надписи «код отправлен». Только после этого вернитесь на сайт и нажмите кнопку «Получить код».',
      },
      {
        title: 'Рекомендации',
        text: 'Обязательно прочитайте рекомендации по безопасности ниже. Без них аккаунт быстро заблокируют.',
      },
    ],
    recommendations: [
      'Не используйте VPN для входа. VPN, особенно общий, вызывает подозрения у систем безопасности Telegram.',
      'Входите через прокси. Купите прокси и используйте его не более чем для 5 аккаунтов.',
      'Включите двухфакторную аутентификацию (2FA): Настройки → Конфиденциальность и безопасность → Двухфакторная аутентификация.',
      'Дайте аккаунту «отлежаться» 2 дня — просто не выполняйте активных действий.',
      'На 3-й день симулируйте активность: попросите 3–4 друзей написать вам в разное время, поговорите с ними.',
      'На 4-й день можно начинать работу — аккаунт готов.',
    ],
  },
  orders: {
    heading: 'Мои покупки',
    sub: 'Вся история ваших покупок. Архивы оптовых заказов можно скачать здесь.',
    loadFailed: 'Не удалось загрузить покупки',
    emptyTitle: 'Покупок пока нет',
    emptyText:
      'Выберите страну в магазине — аккаунт появится здесь сразу после покупки.',
    bulkOrder: 'Оптовый заказ',
    bulkOrderQty: (n: number) => `Оптовый заказ · ${n} шт.`,
    accountFallback: 'Аккаунт',
    refunded: 'Возврат',
    active: 'Активна',
    downloadArchive: 'Скачать архив',
    getArchive: 'Получить архив',
    archiveTtl: 'Архив доступен около 2–3 дней после покупки.',
    archivePending: 'Архив ещё готовится — попробуйте через минуту.',
    archiveGone:
      'Архив недоступен. Архивы хранятся ограниченное время (около 2–3 дней после покупки).',
    archiveFailed: 'Не удалось получить архив',
  },
  topup: {
    heading: 'Пополнение баланса',
    sub: 'Выберите способ оплаты и сумму — баланс зачислится автоматически.',
    method: 'Способ оплаты',
    amount: 'Сумма (USD)',
    customAmount: 'Своя сумма',
    customAmountPlaceholder: 'Своя сумма, $',
    heleketDesc: 'USDT, BTC, ETH, TON и 100+ монет',
    cryptobotDesc: 'Оплата внутри Telegram',
    waitingPay: 'Ожидаем оплату…',
    completePay:
      'Завершите платёж в открывшемся окне. Баланс в боте и на сайте обновится автоматически.',
    openPay: 'Открыть оплату',
    paidCredited: (amount: string) =>
      `Оплата получена — ${amount} зачислено на баланс.`,
    paidFound: 'Оплата найдена и зачислена на баланс.',
    notCompleted: 'Платёж не был завершён.',
    notConfirmed:
      'Не дождались подтверждения оплаты. Если вы оплатили — нажмите «Проверить оплату».',
    createFailed: 'Не удалось создать платёж',
    requestError: 'Ошибка запроса',
    topupFor: (amount: string) => `Пополнить на ${amount}`,
    wait: 'Подождите…',
    checkPay: 'Проверить оплату',
    recent: 'Последние пополнения',
    paid: 'Оплачено',
    processing: 'В обработке',
  },
  referral: {
    heading: 'Реферальная программа',
    sub: 'Делитесь ссылкой и получайте процент с пополнений приглашённых.',
    loadFailed: 'Не удалось загрузить данные',
    invited: 'Приглашено',
    earned: 'Заработано',
    yourLink: 'Ваша реферальная ссылка',
    percentNote: (p: number) => `${p}% с пополнений`,
    linkUnavailable: 'Ссылка недоступна',
    linkLabel: 'Реферальная ссылка',
    shareNote:
      'Отправьте ссылку другу. Когда он зарегистрируется в боте и пополнит баланс, вы автоматически получите бонус на свой счёт.',
  },
  about: {
    badge: 'О сервисе',
    titleA: 'Мы —',
    titleB: ', сервис продажи Telegram-аккаунтов',
    subtitle:
      'Продаём отлежавшиеся Telegram-аккаунты по странам с мгновенной автоматической выдачей: Session + Tdata, коды входа онлайн, оптовые заказы и единый баланс между сайтом и ботом. Работаем быстро, прозрачно и с живой поддержкой.',
    stats: [
      { value: '70+', label: 'стран в каталоге' },
      { value: '24/7', label: 'автоматическая выдача' },
      { value: '2', label: 'способа оплаты криптой' },
      { value: '1', label: 'общий баланс с ботом' },
    ],
    whyTitle: 'Почему выбирают нас',
    values: [
      {
        title: 'Мгновенная выдача',
        text: 'Аккаунты выдаются автоматически сразу после оплаты — без ручной обработки и ожидания.',
      },
      {
        title: 'Десятки стран',
        text: 'Каталог постоянно пополняется: США, Европа, Азия и другие регионы — поштучно и оптом.',
      },
      {
        title: 'Замены и поддержка',
        text: 'Живая техподдержка в Telegram. При непредвиденных обстоятельствах поможем с заменой.',
      },
      {
        title: 'Единая экосистема',
        text: 'Сайт и бот работают с одним балансом и одной историей — покупайте там, где удобно.',
      },
    ],
    contactsTitle: 'Контакты',
    contactsSub: 'Мы всегда на связи — выбирайте удобный способ.',
    contacts: [
      {
        title: 'Telegram-бот',
        text: 'Покупка аккаунтов, пополнение и баланс — всё доступно прямо в боте.',
        cta: 'Открыть бота',
      },
      {
        title: 'Техподдержка / Реклама',
        text: 'Вопросы по заказам, замены, сотрудничество и размещение рекламы.',
        cta: 'Написать в поддержку',
      },
      {
        title: 'Тема на форуме LOLZ',
        text: 'Наша официальная тема на форуме: отзывы, обсуждение и новости сервиса.',
        cta: 'Перейти к теме',
      },
    ],
    ctaTitle: 'Готовы попробовать?',
    ctaText: 'Войдите через Telegram и получите первый аккаунт уже через минуту.',
    footerBot: 'Бот',
    footerSupport: 'Поддержка',
  },
}

type Dict = typeof ru

const en: Dict = {
  common: {
    copy: 'Copy',
    copied: 'Copied',
    close: 'Close',
    retry: 'Retry',
    account: 'Account',
    logout: 'Log out',
    language: 'Language',
  },
  nav: {
    shop: 'Shop',
    orders: 'Orders',
    topup: 'Top up',
    referral: 'Referrals',
    about: 'About',
    sections: 'Sections',
    loginTg: 'Sign in with Telegram',
  },
  landing: {
    badge: 'Aged Telegram accounts',
    title: 'Telegram account store with',
    titleAccent: 'instant delivery',
    subtitle:
      'Buy accounts by country — one at a time or in bulk. Session + Tdata and login codes, all in one dashboard with a balance shared with the bot.',
    browseCatalog: 'Browse catalog',
    featuresTitle: 'Everything for a fast and safe purchase',
    featuresSub: 'The same features as in the bot, in a convenient web interface.',
    features: [
      {
        title: 'Accounts by country',
        text: 'A large catalog of aged Telegram accounts with flexible choice of country and quantity.',
      },
      {
        title: 'Instant delivery',
        text: 'Session + Tdata arrive right after paying from your balance — no waiting or manual processing.',
      },
      {
        title: 'Login codes online',
        text: 'Request an authorization code right on the site in one click, whenever you need it.',
      },
      {
        title: 'Crypto payments',
        text: 'Top up via CryptoBot, Heleket or OxaPay — USDT, BTC, ETH and other coins.',
      },
      {
        title: 'Shared balance',
        text: 'Your balance is synced with the bot: top up anywhere — spend anywhere.',
      },
      {
        title: 'Sign in with Telegram',
        text: 'No passwords. Authorization goes through your bot — fast and secure.',
      },
    ],
    howTitle: 'How it works',
    howSub: 'Four steps from signing in to a ready-to-use account.',
    steps: [
      {
        title: 'Sign in with Telegram',
        text: 'Press "Sign in" and confirm in the bot with a single message.',
      },
      {
        title: 'Top up your balance',
        text: 'The top-up is credited on the site and in the bot at the same time.',
      },
      {
        title: 'Pick a country',
        text: 'Open the catalog and choose a country and quantity of accounts.',
      },
      {
        title: 'Get your accounts',
        text: 'Credentials and login codes are available right in your dashboard.',
      },
    ],
    ctaTitle: 'Ready to start?',
    ctaText:
      'Sign in with Telegram — registration happens automatically on first login.',
    footerSync: 'Balance and accounts are synced with the Telegram bot',
  },
  login: {
    title: 'Sign in with Telegram',
    text: 'Authorization happens right in the bot. No passwords — your balance and purchases are the same as in Telegram.',
    waiting: 'Waiting for confirmation in the bot...',
    openBot: 'Open Telegram and press "Start" in the bot. If the bot did not open —',
    followLink: 'follow this link',
    tryAgain: 'try again',
    loggingIn: 'Signing in...',
    secure: 'Secure sign-in. We never ask for your Telegram password.',
    startFailed: 'Failed to start sign-in',
    timedOut: 'Timed out waiting. Please try again.',
    codeExpired: 'The login code has expired. Please try again.',
    loginError: 'Sign-in error',
  },
  shop: {
    heading: 'Shop',
    sub: 'Pick a country — accounts are delivered instantly after paying from your balance.',
    searchPlaceholder: 'Search country...',
    searchLabel: 'Search country',
    sortLabel: 'Catalog sorting',
    sortPopular: 'Most popular',
    sortCheap: 'Cheapest first',
    sortExpensive: 'Most expensive first',
    loading: 'Loading catalog...',
    unavailable: 'Catalog is temporarily unavailable',
    connError: 'Connection error with the bot.',
    nothing: 'Nothing found.',
    inStock: (n: number) => `In stock: ${n}`,
    outOfStock: 'Out of stock',
  },
  purchase: {
    stockLine: (n: number, price: string) => `${n} in stock · ${price} each`,
    single: 'Single',
    bulk: 'Bulk',
    quantity: 'Quantity',
    total: 'Total',
    buyFor: (price: string) => `Buy for ${price}`,
    processing: 'Processing...',
    preparingArchive: 'Preparing archive…',
    dontClosePage: 'Do not close this page',
    archivePreparingNote:
      '— the archive with accounts is being prepared. You can also download it later in the "Orders" section.',
    purchased: 'Purchase completed.',
    enterNumberNote:
      'Enter this number in the official Telegram client (on a computer, or via Nicegram on a phone). Press "Get code"',
    onlyAfter: 'only after',
    codeSentSuffix: ' Telegram shows that the code has been sent.',
    loginCode: 'Login code:',
    waitingCode: 'Waiting for the code from Telegram…',
    secondsLeft: (s: number) => `Up to ${s}s left. Do not close this page.`,
    getCode: 'Get code',
    codeError: 'The purchase ended with an error — the code is unavailable.',
    codeTimeout:
      'The code did not arrive within 120 seconds. Make sure you entered the number in Telegram and saw "code sent", then press "Retry".',
    downloadArchive: 'Download the accounts archive (TData + Session)',
    archiveLater:
      'The archive is still being prepared — the link will appear in "Orders".',
    goToOrders: 'Go to orders',
    buyFailed: 'Purchase failed',
    warnRecord: 'Be sure to start a screen recording before logging into the account.',
    warnRecordSuffix: 'It will help you get a replacement in case of unforeseen issues.',
    deviceNote1: 'Login is via a code from Telegram.',
    deviceNote2: 'Only log in from a computer.',
    deviceNote3: 'On a phone — only via a native app such as',
    deviceNote4: '(the regular official client on a phone will not work).',
    bulkNote1: 'In bulk you can buy even',
    bulkNote2: '1 piece',
    bulkNote3: '. Delivery format:',
    bulkNote4: '(as an archive).',
    recsTitle: 'Account safety recommendations',
    steps: [
      {
        title: 'Purchase',
        text: 'Press the "Buy" button. Login is performed with a code from Telegram. Only log in from a computer; on a phone use a native app such as Nicegram.',
      },
      {
        title: 'Authorization',
        text: 'Open the official Telegram client and sign in with the issued phone number. Telegram will request a confirmation code.',
      },
      {
        title: 'Getting the code',
        text: 'First enter the number in Telegram and wait for the "code sent" message. Only then return to the site and press "Get code".',
      },
      {
        title: 'Recommendations',
        text: 'Be sure to read the safety recommendations below. Without them the account will quickly get banned.',
      },
    ],
    recommendations: [
      'Do not use a VPN to log in. A VPN, especially a shared one, raises suspicion with Telegram security systems.',
      'Log in through a proxy. Buy a proxy and use it for no more than 5 accounts.',
      'Enable two-factor authentication (2FA): Settings → Privacy and Security → Two-Step Verification.',
      'Let the account "rest" for 2 days — simply avoid any active actions.',
      'On day 3, simulate activity: ask 3–4 friends to message you at different times and chat with them.',
      'On day 4 you can start working — the account is ready.',
    ],
  },
  orders: {
    heading: 'My orders',
    sub: 'Your full purchase history. Bulk order archives can be downloaded here.',
    loadFailed: 'Failed to load orders',
    emptyTitle: 'No purchases yet',
    emptyText:
      'Pick a country in the shop — the account will appear here right after purchase.',
    bulkOrder: 'Bulk order',
    bulkOrderQty: (n: number) => `Bulk order · ${n} pcs`,
    accountFallback: 'Account',
    refunded: 'Refunded',
    active: 'Active',
    downloadArchive: 'Download archive',
    getArchive: 'Get archive',
    archiveTtl: 'The archive is available for about 2–3 days after purchase.',
    archivePending: 'The archive is still being prepared — try again in a minute.',
    archiveGone:
      'The archive is unavailable. Archives are kept for a limited time (about 2–3 days after purchase).',
    archiveFailed: 'Failed to fetch the archive',
  },
  topup: {
    heading: 'Top up balance',
    sub: 'Choose a payment method and amount — the balance is credited automatically.',
    method: 'Payment method',
    amount: 'Amount (USD)',
    customAmount: 'Custom amount',
    customAmountPlaceholder: 'Custom amount, $',
    heleketDesc: 'USDT, BTC, ETH, TON and 100+ coins',
    cryptobotDesc: 'Pay inside Telegram',
    waitingPay: 'Waiting for payment…',
    completePay:
      'Complete the payment in the opened window. The balance in the bot and on the site will update automatically.',
    openPay: 'Open payment',
    paidCredited: (amount: string) =>
      `Payment received — ${amount} credited to your balance.`,
    paidFound: 'Payment found and credited to your balance.',
    notCompleted: 'The payment was not completed.',
    notConfirmed:
      'Payment confirmation timed out. If you have paid — press "Check payment".',
    createFailed: 'Failed to create the payment',
    requestError: 'Request error',
    topupFor: (amount: string) => `Top up ${amount}`,
    wait: 'Please wait…',
    checkPay: 'Check payment',
    recent: 'Recent top-ups',
    paid: 'Paid',
    processing: 'Processing',
  },
  referral: {
    heading: 'Referral program',
    sub: 'Share your link and earn a percentage of your referrals\u2019 top-ups.',
    loadFailed: 'Failed to load data',
    invited: 'Invited',
    earned: 'Earned',
    yourLink: 'Your referral link',
    percentNote: (p: number) => `${p}% of top-ups`,
    linkUnavailable: 'Link unavailable',
    linkLabel: 'Referral link',
    shareNote:
      'Send the link to a friend. When they register in the bot and top up their balance, you automatically receive a bonus to your account.',
  },
  about: {
    badge: 'About the service',
    titleA: 'We are',
    titleB: ' — a Telegram account selling service',
    subtitle:
      'We sell aged Telegram accounts by country with instant automatic delivery: Session + Tdata, online login codes, bulk orders and a single balance shared between the site and the bot. Fast, transparent, with live support.',
    stats: [
      { value: '70+', label: 'countries in the catalog' },
      { value: '24/7', label: 'automatic delivery' },
      { value: '2', label: 'crypto payment methods' },
      { value: '1', label: 'balance shared with the bot' },
    ],
    whyTitle: 'Why choose us',
    values: [
      {
        title: 'Instant delivery',
        text: 'Accounts are issued automatically right after payment — no manual processing or waiting.',
      },
      {
        title: 'Dozens of countries',
        text: 'The catalog keeps growing: USA, Europe, Asia and other regions — single or in bulk.',
      },
      {
        title: 'Replacements and support',
        text: 'Live support in Telegram. In case of unforeseen issues we will help with a replacement.',
      },
      {
        title: 'One ecosystem',
        text: 'The site and the bot share one balance and one history — buy wherever is convenient.',
      },
    ],
    contactsTitle: 'Contacts',
    contactsSub: 'We are always in touch — pick a convenient way.',
    contacts: [
      {
        title: 'Telegram bot',
        text: 'Buying accounts, top-ups and balance — everything is available right in the bot.',
        cta: 'Open the bot',
      },
      {
        title: 'Support / Advertising',
        text: 'Order questions, replacements, cooperation and ad placement.',
        cta: 'Message support',
      },
      {
        title: 'LOLZ forum thread',
        text: 'Our official forum thread: reviews, discussion and service news.',
        cta: 'Go to the thread',
      },
    ],
    ctaTitle: 'Ready to try?',
    ctaText: 'Sign in with Telegram and get your first account within a minute.',
    footerBot: 'Bot',
    footerSupport: 'Support',
  },
}

const messages: Record<Lang, Dict> = { ru, en }

/* ------------------------------------------------------------------ */
/* Provider                                                            */
/* ------------------------------------------------------------------ */

interface LangContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: Dict
  /** Locale string for Date.toLocaleString etc. */
  locale: string
}

const LangContext = createContext<LangContextValue | null>(null)

export function LanguageProvider({
  initialLang,
  children,
}: {
  initialLang: Lang
  children: ReactNode
}) {
  const [lang, setLangState] = useState<Lang>(initialLang)

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try {
      document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
      document.documentElement.lang = next
    } catch {
      // cookie unavailable
    }
  }, [])

  const value = useMemo<LangContextValue>(
    () => ({
      lang,
      setLang,
      t: messages[lang],
      locale: lang === 'ru' ? 'ru-RU' : 'en-US',
    }),
    [lang, setLang],
  )

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext)
  if (!ctx) {
    // Fallback for usage outside the provider (should not happen).
    return {
      lang: 'ru',
      setLang: () => {},
      t: ru,
      locale: 'ru-RU',
    }
  }
  return ctx
}
