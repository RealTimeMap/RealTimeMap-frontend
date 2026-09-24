# features/places

Раздел «Места»: личные метки и группы. Работает офлайн. Данные хранит `00.shared/stores/places`, изменения копятся в очереди мутаций и синхронизируются при появлении сети.

| Слайс                | Что делает                             |
| -------------------- | -------------------------------------- |
| `PersonalMarkForm`   | создание и редактирование личной метки |
| `PersonalMarkDetail` | карточка личной метки                  |
| `PersonalGroups`     | группы личных меток                    |
| `PersonalMarksLayer` | слой личных меток на карте             |

> Между слайсами есть циклические импорты: `PersonalGroups` ↔ `PersonalMarkDetail` и `PersonalMarkDetail` ↔ `PersonalMarkForm`. Их стоит разорвать, например через `04.widgets/PlacesManager` или через события.
