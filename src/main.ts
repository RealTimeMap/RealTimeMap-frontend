import App from './app.vue'
import websocketPlugin from './plugins/websocket'
import { withI18n } from './providers/withI18n'
import { withNaiveUI } from './providers/withNaiveUi.ts'
import router from './shared/lib/router.ts'
import './assets/scss/index.scss'

import 'vfonts/Lato.css'
import 'vfonts/FiraCode.css'

const app = createApp(App)

withI18n(app)
withNaiveUI(app)
app.use(createPinia())
app.use(router)
app.use(websocketPlugin)

app.mount('#app')
