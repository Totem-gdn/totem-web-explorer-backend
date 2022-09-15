#### Find Top 12

GET /games

Response:

```json
[
  {
    "id": "string",
    "ownerAddress": "string",
    "createdAt": "string",
    "updatedAt": "string",
    "general": {
      "name": "string",
      "author": "string",
      "description": "string",
      "fullDescription": "string",
      "genre": [
        "string"
      ]
    },
    "details": {
      "status": "string",
      "platforms": "string",
      "madeWith": "string",
      "averageSession": "string",
      "languages": "string",
      "inputs": "string"
    },
    "images": {
      "coverImage": "string",
      "cardThumbnail": "string",
      "smallThumbnail": "string",
      "imagesGallery": [
        "string"
      ]
    },
    "socialMedia": {
      "promoVideo": "string",
      "integrations": [
        {
          "type": "string",
          "url": "string"
        }
      ]
    },
    "contacts": {
      "email": "string",
      "discord": "string"
    }
  }
]
```

#### Find By Id

GET /games/:id

Response

```json
{
  "id": "string",
  "ownerAddress": "string",
  "createdAt": "string",
  "updatedAt": "string",
  "general": {
    "name": "string",
    "author": "string",
    "description": "string",
    "fullDescription": "string",
    "genre": [
      "string"
    ]
  },
  "details": {
    "status": "string",
    "platforms": "string",
    "madeWith": "string",
    "averageSession": "string",
    "languages": "string",
    "inputs": "string"
  },
  "images": {
    "coverImage": "string",
    "cardThumbnail": "string",
    "smallThumbnail": "string",
    "imagesGallery": [
      "string"
    ]
  },
  "socialMedia": {
    "promoVideo": "string",
    "integrations": [
      {
        "type": "string",
        "url": "string"
      }
    ]
  },
  "contacts": {
    "email": "string",
    "discord": "string"
  }
}
```

#### Create game

POST /games

Request:

```json
{
  "ownerAddress": "string, is_not_empty",
  "general": {
    "name": "string, is_not_empty",
    "author": "string, is_not_empty",
    "description": "string, is_not_empty, max_length=300",
    "fullDescription": "string, is_not_empty, max_length=3000",
    "genre": [
      "string, is_not_empty"
    ]
  },
  "details": {
    "status": "string, is_not_empty",
    "platforms": "string, is_not_empty",
    "madeWith": "string, is_not_empty",
    "averageSession": "string, is_not_empty",
    "languages": "string, is_not_empty",
    "inputs": "string, is_not_empty"
  },
  "images": {
    "coverImage": {
      "filename": "string, is_not_empty",
      "mimeType": "is_mime_type, /(^image)(\/)([a-zA-Z0-9_.\\-+]+)/",
      "contentLength": 0
    },
    "cardThumbnail": {
      "filename": "string, is_not_empty",
      "mimeType": "is_mime_type, /(^image)(\/)([a-zA-Z0-9_.\\-+]+)/",
      "contentLength": 0
    },
    "smallThumbnail": {
      "filename": "string, is_not_empty",
      "mimeType": "is_mime_type, /(^image)(\/)([a-zA-Z0-9_.\\-+]+)/",
      "contentLength": 0
    },
    "imagesGallery": [
      {
        "filename": "string, is_not_empty",
        "mimeType": "is_mime_type, /(^image)(\/)([a-zA-Z0-9_.\\-+]+)/",
        "contentLength": 0
      }
    ]
  },
  "socialMedia": {
    "promoVideo": "is_not_empty, is_url",
    "integrations": [
      {
        "type": "string, is_not_empty",
        "url": "is_not_empty, is_url"
      }
    ]
  },
  "contacts": {
    "email": "is_not_empty, is_email",
    "discord": "string, is_not_empty"
  }
}
```

Response

```json
{
  "id": "string",
  "uploadImageURLs": {
    "coverImage": "url",
    "cardThumbnail": "url",
    "smallThumbnail": "url",
    "imagesGallery": [
      "url"
    ]
  }
}
```
