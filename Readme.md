# Zadania API AIDevs

Express.js API wykonujące zadania AI Devs API


## Instalacja

Uruchom `npm i --save` aby pobrać paczku node_modules do folderu `node_modules/`.

## Konfiguracja
Dodaj plik `.env`

```
AIDevs_API_KEY=57dc4540-XXXX-XXXX-XXXX-.......
OPEN_AI_KEY=sk-......
```

## Uruchom pojekt

Wykonaj polecenie
`node app.js`

## Dostepne zadania
Po uruchomieniu API przejdz pod adres: `http://localhost:3000/`, a otrzymasz listę dostępnych endpointów wykonujące zadania

Przykładowo:
```
endpoints	
0	"moderation"
1	"blogger"
```
## Uruchom zadanie `moderation'

Aby wykonać zadanie przejdź pod adres: `http://localhost:3000/moderation`
