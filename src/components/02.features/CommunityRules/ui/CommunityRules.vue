<script setup lang="ts">
import { useDialogStore } from '@/components/00.shared/stores/dialog'
import { OPERATOR } from '@/components/02.features/LegalPolicy'
import { RULES_DOC, RULES_VERSION } from '../model/rules'

const { close } = useDialogStore()

interface Level {
  n: number
  short: string
  full: string
}

const LEVELS: Level[] = [
  { n: 1, short: 'Предупреждение', full: 'Предупреждение и удаление контента' },
  { n: 2, short: 'Блокировка 7 дней', full: 'Удаление контента и блокировка аккаунта на 7 дней' },
  { n: 3, short: 'Блокировка 30 дней', full: 'Удаление контента и блокировка аккаунта на 30 дней' },
  { n: 4, short: 'Постоянный бан', full: 'Постоянная блокировка аккаунта' },
  { n: 5, short: 'Бан + правоохранители', full: 'Постоянная блокировка и передача информации в правоохранительные органы' },
]

interface Rule {
  n: string
  text: string
  desc: string
  first: number
  repeat: number
  law?: string
}

interface Section {
  title: string
  intro?: string
  rules: Rule[]
}

const sections: Section[] = [
  {
    title: '3. Контент: метки, фото, тексты',
    intro: '3.1. Запрещено создавать метки и публиковать контент следующих типов:',
    rules: [
      {
        n: '3.1.1.',
        text: 'Оборот наркотиков и их пропаганда.',
        desc: 'Любые упоминания продажи, покупки, изготовления или рекламы наркотических и психотропных веществ, публикация «закладок» и точек сбыта, а также склонение к употреблению. Мера применяется немедленно, данные передаются в правоохранительные органы.',
        first: 5,
        repeat: 5,
        law: 'УК РФ ст. 228, 228.1; КоАП РФ ст. 6.13; ФЗ № 3-ФЗ «О наркотических средствах…»',
      },
      {
        n: '3.1.2.',
        text: 'Продажа оружия, поддельных документов, краденого.',
        desc: 'Объявления о продаже огнестрельного и холодного оружия, боеприпасов, взрывчатых веществ, поддельных документов (паспорта, дипломы, справки), а также заведомо краденого имущества.',
        first: 5,
        repeat: 5,
        law: 'УК РФ ст. 222, 327, 175',
      },
      {
        n: '3.1.3.',
        text: 'Опасность для несовершеннолетних.',
        desc: 'Любые материалы сексуального характера с участием детей, а также контент, вовлекающий несовершеннолетних в опасную или противоправную деятельность. Немедленная блокировка и передача данных.',
        first: 5,
        repeat: 5,
        law: 'УК РФ ст. 242.1, 242.2; ФЗ № 436-ФЗ «О защите детей от информации…»',
      },
      {
        n: '3.1.4.',
        text: 'Терроризм, экстремизм, разжигание вражды.',
        desc: 'Призывы к террору и насилию, оправдание терроризма, пропаганда и символика экстремистских организаций, разжигание ненависти по признакам национальности, религии, пола и иным.',
        first: 5,
        repeat: 5,
        law: 'Конституция РФ ст. 29 ч. 2; УК РФ ст. 205.2, 280, 282; ФЗ № 114-ФЗ «О противодействии экстремистской деятельности»',
      },
      {
        n: '3.1.5.',
        text: 'Порнография, жестокость, шок-контент (18+).',
        desc: 'Изображения и видео порнографического характера, сцены жестокости и насилия, расчленение, пропаганда суицида и самоповреждения. За первое нарушение — постоянный бан, при отягчающих обстоятельствах — передача данных.',
        first: 4,
        repeat: 5,
        law: 'УК РФ ст. 242; ФЗ № 436-ФЗ',
      },
      {
        n: '3.1.6.',
        text: 'Угрозы и доксинг.',
        desc: 'Угрозы жизни, здоровью или имуществу, а также публикация чужих личных данных без согласия: адрес, телефон, паспортные данные, место работы или учёбы.',
        first: 4,
        repeat: 5,
        law: 'Конституция РФ ст. 23, 24; УК РФ ст. 119, 137; ФЗ № 152-ФЗ «О персональных данных»',
      },
      {
        n: '3.1.7.',
        text: 'Мошенничество и фишинг.',
        desc: 'Обман с целью завладеть деньгами или данными: фейковые розыгрыши и «инвестиции», просьбы перевести деньги, финансовые пирамиды, ссылки на поддельные сайты.',
        first: 4,
        repeat: 5,
        law: 'УК РФ ст. 159',
      },
      {
        n: '3.1.8.',
        text: 'Клевета и оскорбления в метках.',
        desc: 'Заведомо ложные порочащие сведения о людях, а также оскорбительные и унижающие формулировки в названиях и описаниях меток.',
        first: 2,
        repeat: 3,
        law: 'УК РФ ст. 128.1; КоАП РФ ст. 5.61',
      },
      {
        n: '3.1.9.',
        text: 'Метки на частных адресах без согласия.',
        desc: 'Метки, указывающие на жильё конкретного человека (дом, квартира, дача) без его согласия — это раскрытие частной жизни и местоположения.',
        first: 3,
        repeat: 4,
        law: 'Конституция РФ ст. 23; ФЗ № 152-ФЗ',
      },
      {
        n: '3.1.10.',
        text: 'Нарушение авторских прав.',
        desc: 'Публикация чужих фотографий, логотипов, текстов и иных материалов без разрешения правообладателя.',
        first: 2,
        repeat: 3,
        law: 'ГК РФ ст. 1229, 1259, 1270; УК РФ ст. 146',
      },
      {
        n: '3.1.11.',
        text: 'Реклама и спам-метки.',
        desc: 'Коммерческие метки без пользы для сообщества, массовое продвижение товаров и услуг, накрутка внимания к бизнесу через фейковые точки.',
        first: 1,
        repeat: 2,
        law: 'ФЗ № 38-ФЗ «О рекламе»',
      },
      {
        n: '3.1.12.',
        text: 'Ложные и «мусорные» метки.',
        desc: 'Несуществующие места и события, недостоверная информация, розыгрыши и бессмысленный контент, вводящий других в заблуждение.',
        first: 1,
        repeat: 2,
      },
      {
        n: '3.1.13.',
        text: 'Дубли меток.',
        desc: 'Одна и та же метка, размещённая несколько раз в одном или соседних местах.',
        first: 1,
        repeat: 1,
      },
      {
        n: '3.1.14.',
        text: 'Нецензурная брань.',
        desc: 'Мат и грубая лексика в публичных названиях и описаниях, которые видят другие пользователи.',
        first: 1,
        repeat: 2,
        law: 'КоАП РФ ст. 20.1',
      },
    ],
  },
  {
    title: '4. Геолокация и приватность',
    rules: [
      {
        n: '4.1.',
        text: 'Раскрытие чужого местоположения.',
        desc: 'Публикация текущего или домашнего местоположения другого человека без его согласия, в том числе через метки и комментарии.',
        first: 4,
        repeat: 5,
        law: 'Конституция РФ ст. 23, 24; ФЗ № 152-ФЗ',
      },
      {
        n: '4.2.',
        text: 'Слежка и преследование.',
        desc: 'Систематическое отслеживание перемещений человека, преследование и запугивание с использованием карты и меток.',
        first: 5,
        repeat: 5,
        law: 'УК РФ ст. 119, 137',
      },
    ],
  },
  {
    title: '5. Общение: чаты и комментарии',
    rules: [
      {
        n: '5.1.',
        text: 'Оскорбления и травля.',
        desc: 'Унижение чести и достоинства, буллинг, оскорбительные высказывания в адрес других пользователей.',
        first: 2,
        repeat: 3,
        law: 'КоАП РФ ст. 5.61',
      },
      {
        n: '5.2.',
        text: 'Дискриминация и вражда.',
        desc: 'Высказывания, унижающие человека или группу по признаку расы, национальности, религии, пола, ориентации или иному признаку.',
        first: 3,
        repeat: 4,
        law: 'Конституция РФ ст. 19; УК РФ ст. 136, 282',
      },
      {
        n: '5.3.',
        text: 'Спам и флуд.',
        desc: 'Массовая рассылка, повторяющиеся однотипные сообщения, навязчивая реклама в чатах и комментариях.',
        first: 1,
        repeat: 2,
        law: 'ФЗ № 38-ФЗ',
      },
      {
        n: '5.4.',
        text: 'Мошеннические и фишинговые ссылки.',
        desc: 'Сообщения со ссылками на поддельные сайты, выманивание паролей, кодов и платёжных данных.',
        first: 4,
        repeat: 5,
        law: 'УК РФ ст. 159, 272',
      },
    ],
  },
  {
    title: '6. Аккаунт и безопасность',
    rules: [
      {
        n: '6.1.',
        text: 'Выдача себя за другого.',
        desc: 'Использование имени, фотографий и данных другого человека или организации с целью ввести в заблуждение (фейковые профили, «клоны»).',
        first: 3,
        repeat: 4,
        law: 'ГК РФ ст. 152.1, 152.2',
      },
      {
        n: '6.2.',
        text: 'Боты и накрутки.',
        desc: 'Автоматизированные действия и искусственное увеличение лайков, подписок и активности, использование стороннего ПО.',
        first: 3,
        repeat: 4,
      },
      {
        n: '6.3.',
        text: 'Взлом и нарушение работы сервиса.',
        desc: 'Попытки несанкционированного доступа, эксплойты, обход ограничений, атаки на инфраструктуру приложения.',
        first: 4,
        repeat: 5,
        law: 'УК РФ ст. 272, 273',
      },
      {
        n: '6.4.',
        text: 'Обход блокировки.',
        desc: 'Создание новых аккаунтов после блокировки для продолжения нарушений.',
        first: 4,
        repeat: 4,
      },
    ],
  },
]

function levelShort(n: number): string {
  return LEVELS.find(l => l.n === n)?.short ?? ''
}

// Реквизит считается заполненным, если он не пустой и не является
// плейсхолдером вида «[…]». Незаполненные реквизиты не показываем.
function filled(value?: string): boolean {
  return !!value && !value.trim().startsWith('[')
}

const effectiveDate = computed(() => filled(RULES_DOC.approvedAt) ? RULES_DOC.approvedAt : RULES_VERSION)

const reportText = computed(() =>
  filled(OPERATOR.email)
    ? `7.2. Сообщить о нарушении можно через функцию жалобы в приложении или письмом на ${OPERATOR.email}. Приложите детали: метку, профиль, скриншот и описание.`
    : '7.2. Сообщить о нарушении можно через функцию жалобы в приложении. Приложите детали: метку, профиль, скриншот и описание.',
)

const signText = computed(() => {
  let s = 'Документ сформирован в электронном виде'
  if (filled(OPERATOR.name))
    s += ` оператором ${OPERATOR.name}`
  s += ' и является действительным без собственноручной подписи.'
  if (filled(OPERATOR.address))
    s += ` Адрес: ${OPERATOR.address}.`
  if (filled(OPERATOR.email))
    s += ` Обращения: ${OPERATOR.email}.`
  return s
})
</script>

<template>
  <div class="rules">
    <div class="rules-header">
      <button
        class="button-back"
        type="button"
        @click="close"
      >
        <u-icon icon="line-md:arrow-small-left" />
      </button>
      <h2>Правила сообщества</h2>
    </div>

    <div class="rules-body">
      <div class="doc">
        <div class="doc__head">
          <div class="doc__org">
            <template v-if="filled(OPERATOR.name)">
              {{ OPERATOR.name }}
            </template>
            <template v-else>
              Оператор приложения «RealTimeMap»
            </template>
            <template v-if="filled(OPERATOR.inn)">
              <br>ИНН {{ OPERATOR.inn }}
            </template>
          </div>
          <div
            v-if="filled(RULES_DOC.approvedBy)"
            class="doc__approve"
          >
            УТВЕРЖДЕНЫ<br>
            {{ RULES_DOC.approvedBy }}<br>
            от {{ effectiveDate }}
          </div>
        </div>
        <div class="doc__type">
          {{ RULES_DOC.type }}
        </div>
        <div class="doc__meta">
          <span v-if="filled(RULES_DOC.place)">{{ RULES_DOC.place }}</span>
          <span>Введены в действие с {{ effectiveDate }}</span>
          <span>Редакция от {{ RULES_VERSION }}</span>
          <span v-if="filled(RULES_DOC.number)">{{ RULES_DOC.number }}</span>
        </div>
      </div>

      <p class="rules-lead">
        RealTimeMap — карта живых мест, меток и событий вокруг вас. Настоящие
        Правила определяют, что запрещено в приложении и какие меры применяются за
        нарушения. Используя приложение, вы принимаете эти Правила.
      </p>

      <!-- 1 -->
      <section>
        <h3>1. Общие положения</h3>
        <p class="r">
          1.1. Сервис действует на территории Российской Федерации, отношения
          сторон регулируются законодательством РФ, включая Конституцию РФ.
        </p>
        <p class="r">
          1.2. Правила распространяются на весь пользовательский контент: метки,
          фотографии, названия и описания, сообщения, комментарии, имя, тег и
          аватар профиля.
        </p>
        <p class="r">
          1.3. Пользователь несёт ответственность за размещаемый контент и свои
          действия в приложении.
        </p>
        <p class="r">
          1.4. Приложением запрещено пользоваться лицам младше возраста,
          допустимого законодательством РФ.
        </p>
      </section>

      <!-- 2 -->
      <section>
        <h3>2. Меры за нарушения</h3>
        <p class="r">
          2.1. За нарушение применяется мера в зависимости от тяжести. Как
          правило, за первое нарушение — более мягкая мера, за повтор — строже:
        </p>
        <p
          v-for="lvl in LEVELS"
          :key="lvl.n"
          class="r ind"
        >
          <span
            class="pen"
            :class="`pen--${lvl.n}`"
          >{{ lvl.short }}</span>
          — {{ lvl.full }}.
        </p>
        <p class="r">
          2.2. Повторные однотипные нарушения повышают меру на одну ступень. При
          грубых нарушениях (уровень «Постоянный бан» и выше) мера применяется
          сразу, без предупреждения.
        </p>
      </section>

      <section
        v-for="sec in sections"
        :key="sec.title"
      >
        <h3>{{ sec.title }}</h3>
        <p
          v-if="sec.intro"
          class="r"
        >
          {{ sec.intro }}
        </p>

        <div
          v-for="rule in sec.rules"
          :key="rule.n"
          class="rule"
        >
          <p class="rule-title">
            {{ rule.n }} {{ rule.text }}
          </p>
          <p class="rule-desc">
            {{ rule.desc }}
          </p>
          <div class="rule-tags">
            <span
              class="pen"
              :class="`pen--${rule.first}`"
            >1-е нарушение: {{ levelShort(rule.first) }}</span>
            <span
              class="pen"
              :class="`pen--${rule.repeat}`"
            >Повтор: {{ levelShort(rule.repeat) }}</span>
          </div>
          <p
            v-if="rule.law"
            class="rule-law"
          >
            Основание: {{ rule.law }}
          </p>
        </div>
      </section>

      <!-- 7 -->
      <section>
        <h3>7. Модерация, жалобы и апелляции</h3>
        <p class="r">
          7.1. Оператор вправе скрывать и удалять контент, нарушающий Правила и
          законодательство РФ, без предварительного уведомления.
        </p>
        <p class="r">
          {{ reportText }}
        </p>
        <p class="r">
          7.3. Апелляцию на меру можно подать тем же способом в течение 30 дней.
          Решение сообщается в ответном письме.
        </p>
      </section>

      <!-- 8 -->
      <section>
        <h3>8. Правовая оговорка и изменения</h3>
        <p class="r">
          8.1. Указанные меры — внутренние санкции сервиса и не заменяют
          ответственность, предусмотренную законодательством РФ. Наличие признаков
          преступления или правонарушения оценивают уполномоченные органы и суд.
        </p>
        <p class="r">
          8.2. Правила могут обновляться; дата редакции указана вверху экрана.
          Продолжая пользоваться приложением, вы принимаете обновлённую редакцию.
        </p>
      </section>

      <div class="doc-sign">
        <u-icon
          icon="solar:document-text-linear"
          height="18"
        />
        <div>
          <p class="doc-sign__title">
            Электронный документ
          </p>
          <p class="doc-sign__text">
            {{ signText }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.rules {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  height: 100%;
}

.rules-header {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-shrink: 0;

  .button-back {
    @include glass-panel(12px, 10px, false);
  }

  h2 {
    @include value-text(24px, var(--text-color), 700);
  }
}

.rules-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  padding-bottom: 20px;

  section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  h3 {
    @include value-text(16px, var(--text-color), 700);
  }
}

.r {
  @include label-text(14px, none);
  line-height: 1.55;

  b {
    color: var(--text-color);
    font-weight: 600;
  }

  &.ind {
    padding-left: 12px;
  }
}

.rule {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 12px;
  border-radius: 12px;
  background: var(--surface-subtle);
}

.rule-title {
  @include value-text(14px, var(--text-color), 600);
  line-height: 1.4;
}

.rule-desc {
  @include label-text(13px, none);
  line-height: 1.5;
}

.rule-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 1px;
}

.rule-law {
  @include label-text(12px, none);
  opacity: 0.8;
  line-height: 1.45;
}

.rules-lead {
  @include value-text(15px, var(--text-color), 500);
  line-height: 1.55;
}

/* ГОСТ-шапка: реквизиты документа */
.doc {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  border-radius: 12px;
  background: var(--surface-subtle);
  border: 0.5px solid var(--border-subtle);

  &__head {
    display: flex;
    justify-content: space-between;
    gap: 16px;
  }

  &__org {
    @include label-text(12px, none);
    line-height: 1.4;
    color: var(--text-color);
    font-weight: 600;
    max-width: 55%;
  }

  &__approve {
    @include label-text(11px, none);
    line-height: 1.4;
    text-align: right;
    max-width: 45%;
  }

  &__type {
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    @include value-text(16px, var(--text-color), 700);
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 4px 12px;
    @include label-text(11px, none);
  }
}

/* Отметка об электронном документе */
.doc-sign {
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--surface-subtle);
  border: 0.5px solid var(--border-subtle);
  color: var(--text-color-secondary);

  &__title {
    @include value-text(13px, var(--text-color), 600);
    margin-bottom: 3px;
  }

  &__text {
    @include label-text(12px, none);
    line-height: 1.5;
  }
}

/* Метка меры наказания — спокойные приглушённые оттенки */
.pen {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px 3px 8px;
  border-radius: 999px;
  white-space: nowrap;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-color-secondary);
  background: var(--surface-subtle);
  border: 0.5px solid var(--border-subtle);

  // Цветной кружок-индикатор степени вместо кричащей заливки
  &::before {
    content: '';
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
    background: var(--pen-dot, var(--text-color-muted));
  }

  &--1 {
    --pen-dot: #86b871;
  }

  &--2 {
    --pen-dot: #d9b45c;
  }

  &--3 {
    --pen-dot: #d99a5c;
  }

  &--4 {
    --pen-dot: #cf7d7d;
  }

  &--5 {
    --pen-dot: #c25c5c;
  }
}
</style>
