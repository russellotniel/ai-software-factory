# EAS Build Configuration

> Part of the AI Software Factory — Deployment OS
> Written for **Expo (React Native) + EAS**

## Overview

This file replaces the previous Kubernetes sizing document. Expo apps are built and distributed via EAS (Expo Application Services) — there is no server infrastructure to size or provision.

---

## eas.json Reference

```json
{
  "cli": {
    "version": ">= 14.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "resourceClass": "m-medium"
      },
      "android": {
        "buildType": "apk",
        "resourceClass": "medium"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "APP_ENV": "staging"
      },
      "ios": {
        "resourceClass": "m-medium"
      },
      "android": {
        "buildType": "aab",
        "resourceClass": "medium"
      }
    },
    "production": {
      "autoIncrement": true,
      "env": {
        "APP_ENV": "production"
      },
      "ios": {
        "resourceClass": "m-large"
      },
      "android": {
        "buildType": "aab",
        "resourceClass": "large"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "",
        "ascAppId": "",
        "appleTeamId": ""
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "production"
      }
    }
  }
}
```

## Resource Classes

| Profile | iOS | Android | Use |
|---|---|---|---|
| development | m-medium | medium | Fast dev builds |
| preview | m-medium | medium | Staging QA |
| production | m-large | large | App Store submission |

Use `m-large` / `large` for production to reduce build times for release builds.
