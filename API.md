## List Games

`GET /games`

Headers:

(optional, needed for `isLiked` field)

```text
Authorization: Bearer Web3Auth.JWT Web3Auth.PublicKey
// OR
Authorization: Bearer Web3Auth.JWT
X-App-PubKey: Web3Auth.PublicKey
```

Params:

```yaml
list:
  in: query
  type: string
  required: false
  description: type of returning games list.
  default: latest
  enum:
    latest
    popular
    random

page:
  in: query
  type: number
  required: false
  description: pagination page number
  default: 1

search:
  in: query
  type: string
  required: false
  description: search by partial game name.
```

Response:

```json
[
  {
    "id": "",
    "owner": "",
    "views": 0,
    "isLiked": false,
    "players": 0,
    "likes": 0,
    "assets": {
      "avatars": 0,
      "items": 0
    },
    "createdAt": "",
    "updatedAt": "",
    "general": {
      "name": "",
      "author": "",
      "description": "",
      "fullDescription": "",
      "genre": [
        ""
      ]
    },
    "details": {
      "status": "",
      "platforms": [
        ""
      ],
      "madeWith": "",
      "session": "",
      "languages": "",
      "inputs": ""
    },
    "images": {
      "coverImage": "",
      "cardThumbnail": "",
      "smallThumbnail": "",
      "gallery": [
        ""
      ]
    },
    "connections": {
      "webpage": "",
      "assetRenderer": "",
      "dnaFilters": {
        "avatarFilter": "",
        "assetFilter": "",
        "gemFilter": ""
      },
      "promoVideo": "",
      "socialLinks": [
        {
          "type": "",
          "url": ""
        }
      ]
    },
    "contacts": {
      "email": "",
      "discord": ""
    }
  }
]
```

## Find Game By Id

`GET /games/:id`

Headers:

(optional, needed for `isLiked` field)

```text
Authorization: Bearer Web3Auth.JWT Web3Auth.PublicKey
// OR
Authorization: Bearer Web3Auth.JWT
X-App-PubKey: Web3Auth.PublicKey
```

Response

```json
{
  "id": "",
  "owner": "",
  "views": 0,
  "isLiked": false,
  "players": 0,
  "likes": 0,
  "assets": {
    "avatars": 0,
    "items": 0
  },
  "createdAt": "",
  "updatedAt": "",
  "general": {
    "name": "",
    "author": "",
    "description": "",
    "fullDescription": "",
    "genre": [
      ""
    ]
  },
  "details": {
    "status": "",
    "platforms": [
      ""
    ],
    "madeWith": "",
    "session": "",
    "languages": "",
    "inputs": ""
  },
  "images": {
    "coverImage": "",
    "cardThumbnail": "",
    "smallThumbnail": "",
    "gallery": [
      ""
    ]
  },
  "connections": {
    "webpage": "",
    "assetRenderer": "",
    "dnaFilters": {
      "avatarFilter": "",
      "assetFilter": "",
      "gemFilter": ""
    },
    "promoVideo": "",
    "socialLinks": [
      {
        "type": "",
        "url": ""
      }
    ]
  },
  "contacts": {
    "email": "",
    "discord": ""
  }
}
```

## Create Game

`POST /games`

Headers:

```text
Authorization: Bearer Web3Auth.JWT Web3Auth.PublicKey
// OR
Authorization: Bearer Web3Auth.JWT
X-App-PubKey: Web3Auth.PublicKey
```

Request:

```json
{
  "owner": "string, is_not_empty",
  "general": {
    "name": "string, is_not_empty",
    "author": "string, is_not_empty",
    "description": "string, is_not_empty, max_length=300",
    "fullDescription": "string, max_length=3000",
    "genre": [ // is_array, array_not_empty
      "string, is_not_empty"
    ]
  },
  "details": {
    "status": "string, is_not_empty",
    "platforms": [ // "is_array, array_not_empty"
      ""
    ],
    "madeWith": "string",
    "session": "string",
    "languages": "string",
    "inputs": "string"
  },
  "images": {
    "coverImage": {
      "filename": "string, is_not_empty",
      "mimeType": "is_mime_type, /(^image)(\/)([a-zA-Z0-9_.\\-+]+)/",
      "contentLength": 0 // number, is_positive
    },
    "cardThumbnail": {
      "filename": "string, is_not_empty",
      "mimeType": "is_mime_type, /(^image)(\/)([a-zA-Z0-9_.\\-+]+)/",
      "contentLength": 0 // number, is_positive
    },
    "smallThumbnail": {
      "filename": "string, is_not_empty",
      "mimeType": "is_mime_type, /(^image)(\/)([a-zA-Z0-9_.\\-+]+)/",
      "contentLength": 0 // number, is_positive
    },
    "gallery": [ // is_array, array_not_empty
      {
        "filename": "string, is_not_empty",
        "mimeType": "is_mime_type, /(^image)(\/)([a-zA-Z0-9_.\\-+]+)/",
        "contentLength": 0 // number, is_positive
      }
    ]
  },
  "connections": {
    "webpage": "is_url",
    "assetRenderer": "is_url",
    "promoVideo": "is_url",
    "dnaFilter": {
      "avatarFilter": {
        "filename": "string, is_not_empty",
        "mimeType": "is_mime_type",
        "contentLength": 0 // number, is_positive
      },
      "assetFilter": {
        "filename": "string, is_not_empty",
        "mimeType": "is_mime_type",
        "contentLength": 0 // number, is_positive
      },
      "gemFilter": {
        "filename": "string, is_not_empty",
        "mimeType": "is_mime_type",
        "contentLength": 0 // number, is_positive
      }
    }, // is_optional
    "socialLinks": [ // is_array, array_not_empty
      {
        "type": "string, is_not_empty",
        "url": "is_url"
      }
    ]
  },
  "contacts": {
    "email": "is_email",
    "discord": "string"
  }
}
```

Response

```json
{
  "id": "",
  "connections": {
    "dnaFilters": {
      "avatarFilter": "",
      "assetFilter": "",
      "gemFilter": ""
    }
  },
  "uploadImageURLs": {
    "coverImage": "",
    "cardThumbnail": "",
    "smallThumbnail": "",
    "gallery": [
      ""
    ]
  }
}
```

## Game Operations (Like, Dislike, Played, Approve, Reject)

`PATCH /games/:id/:operation`

Headers:

```text
Authorization: Bearer Web3Auth.JWT Web3Auth.PublicKey
// OR
Authorization: Bearer Web3Auth.JWT
X-App-PubKey: Web3Auth.PublicKey
```
Request:

```yaml

```

## List Assets

`GET /assets/{avatars,items,gems}`

Headers:

(optional, needed for `isLiked` field)

```text
Authorization: Bearer Web3Auth.JWT Web3Auth.PublicKey
// OR
Authorization: Bearer Web3Auth.JWT
X-App-PubKey: Web3Auth.PublicKey
```

Params:

```yaml
list:
  in: query
  type: string
  required: false
  description: type of returning games list.
  default: latest
  enum:
    latest
    popular
    my

page:
  in: query
  type: number
  required: false
  description: pagination page number
  default: 1

gameId:
  in: query
  type: string
  required: false
  description: global game id filter

search:
  in: query
  type: string
  required: false
  description: tokenId search param
```

Response

```json
[
  {
    "id": "",
    "owner": "",
    "owners": [
      ""
    ],
    "tokenId": "",
    "views": 0,
    "createdAt": "",
    "updatedAt": "",
    "isLiked": false,
    "likes": 0,
    "games": 0,
    "lastUsed": ""
  }
]
```

## Find Asset By Id

`GET /assets/{avatars,items,gems}/:id`

Headers:

(optional, needed for `isLiked` field)

```text
Authorization: Bearer Web3Auth.JWT Web3Auth.PublicKey
// OR
Authorization: Bearer Web3Auth.JWT
X-App-PubKey: Web3Auth.PublicKey
```

Response

```json
{
  "id": "",
  "owner": "",
  "owners": [
    ""
  ],
  "tokenId": "",
  "views": 0,
  "createdAt": "",
  "updatedAt": "",
  "isLiked": false,
  "likes": 0,
  "games": 0,
  "lastUsed": ""
}
```

## Asset Operations (Like, Dislike, )

`PATCH /assets/{avatars,items,gems}/:id/:operation/:gameId?`

Headers:

```text
Authorization: Bearer Web3Auth.JWT Web3Auth.PublicKey
// OR
Authorization: Bearer Web3Auth.JWT
X-App-PubKey: Web3Auth.PublicKey
```

Request:

```yaml
id:
  in: path
  type: string
  required: true
  description: asset id

operation:
  in: path
  type: string
  required: true
  description: asset operation
  enum:
    like
    dislike
    use # requires gameId for legacy record
    add # requires gameId for legacy record

gameId:
  in: path
  type: string
  required: false
  description: game id for legacy record

data:
  in: body
  type: string
  required: false
  description: data for legacy record
```
