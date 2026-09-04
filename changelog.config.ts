/**
 * Конфиг changelogen: определяет, какие типы коммитов попадают в CHANGELOG
 * и как каждый из них двигает версию.
 *
 * feat -> minor, всё остальное -> patch, `!` или BREAKING CHANGE -> major.
 */
export default {
  types: {
    feat: { title: '🚀 Функциональность', semver: 'minor' },
    fix: { title: '🩹 Исправления', semver: 'patch' },
    perf: { title: '🔥 Производительность', semver: 'patch' },
    refactor: { title: '💅 Рефакторинг', semver: 'patch' },
    // собственные типы проекта
    upd: { title: '⬆️ Обновления', semver: 'patch' },
    new: { title: '🆕 Новое', semver: 'patch' },
    style: { title: '🎨 Стили', semver: 'patch' },
    docs: { title: '📖 Документация' },
    build: { title: '📦 Сборка' },
    chore: { title: '🏡 Разное' },
    ci: { title: '🤖 CI' },
    test: { title: '✅ Тесты' },
    remove: { title: '🗑 Удаление', semver: 'patch' },
  },

  templates: {
    commitMessage: 'chore(release): v{{newVersion}}',
    tagMessage: 'v{{newVersion}}',
  },
}
