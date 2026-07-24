import type { UserConfig } from '@commitlint/types'
import changelogConfig from './changelog.config'

/**
 * Разрешённые типы берём прямо из конфига changelogen — иначе списки
 * разъедутся, и коммит с «правильным» на вид префиксом молча выпадет
 * из CHANGELOG и не поднимет версию релиза.
 */
const types = Object.keys(changelogConfig.types)

const config: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', types],
    // scope обязателен: коммиты в проекте уже пишутся как fix(ui), feat(core)
    'scope-empty': [2, 'never'],
    // тело сообщения на русском — не заставляем начинать со строчной
    'subject-case': [0],
    'header-max-length': [2, 'always', 100],
  },
}

export default config
