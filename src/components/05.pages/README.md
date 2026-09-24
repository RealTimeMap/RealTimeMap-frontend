# 05.pages

Страницы, привязанные к маршрутам в `00.shared/lib/router.ts`. Страница только собирает виджеты и фичи; логики в ней быть не должно.

```
05.pages/
├── map/HomeMapPage.vue          карта (/), держится в keep-alive
├── places/PlacesPage.vue        «Места»
├── chats/
│   ├── ChatsPage.vue            оболочка раздела с вложенным router-view
│   ├── ChatListPage.vue         список чатов
│   └── ChatRoomPage.vue         переписка
├── profile/
│   ├── ProfilePage.vue          оболочка профиля с цветной подсветкой
│   ├── MyProfilePage.vue        свой профиль
│   └── UserProfilePage.vue      чужой профиль
├── auth/
│   ├── AuthPage.vue             вход и регистрация
│   └── ResetPasswordPage.vue    сброс пароля по ссылке из письма
├── WelcomePage.vue              онбординг при первом запуске
└── NotFoundPage.vue             404
```

Страницы подключаются лениво (`() => import(...)`). Страницы нижней навигации дополнительно предзагружаются в `prefetchNavPages`.
