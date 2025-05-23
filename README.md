# Express에서 NestJS로 마이그레이션 계획

## 1. 프로젝트 구조

### 현재 Express 구조

```
├── .gitignore
├── firebase-admin-config.js      // Firebase 설정
├── note-service.js               // 노트 서비스 로직
├── openai-service.js             // OpenAI 서비스 로직
├── package.json                  // 의존성 관리
├── server.js                     // 메인 서버 파일
└── stats-service.js              // 통계 서비스 로직
```

### 계획된 NestJS 구조

```
src/
├── main.ts                       // 애플리케이션 진입점
├── app.module.ts                 // 루트 모듈
├── config/                       // 환경설정
│   └── firebase.config.ts        // Firebase 설정
├── notes/                        // 노트 모듈
│   ├── notes.module.ts
│   ├── notes.controller.ts
│   ├── notes.service.ts
│   └── dto/
│       ├── create-note.dto.ts
│       └── update-note.dto.ts
├── analysis/                     // 코드분석 모듈
│   ├── analysis.module.ts
│   ├── analysis.controller.ts
│   ├── analysis.service.ts
│   └── dto/
│       └── analyze-code.dto.ts
└── stats/                        // 통계 모듈
    ├── stats.module.ts
    ├── stats.controller.ts
    ├── stats.service.ts
    └── dto/
        ├── file-analysis.dto.ts
        └── quiz-completion.dto.ts
```

## 2. 마이그레이션 단계

1. NestJS 프로젝트 초기화
2. Firebase 설정 마이그레이션
3. 각 서비스 모듈 구현 (노트, 분석, 통계)
4. DTO 및 인터페이스 정의
5. 컨트롤러 구현
6. 환경 설정 및 예외 처리 적용
7. 테스트

## 3. 의존성 업데이트

### 기존 의존성

```json
"dependencies": {
  "axios": "^1.8.1",
  "body-parser": "^1.20.3",
  "cors": "^2.8.5",
  "dotenv": "^16.4.7",
  "express": "^4.21.2",
  "firebase": "^11.4.0",
  "firebase-admin": "^13.1.0"
}
```

### NestJS 의존성 추가

```json
"dependencies": {
  "@nestjs/common": "^10.3.3",
  "@nestjs/core": "^10.3.3",
  "@nestjs/platform-express": "^10.3.3",
  "@nestjs/config": "^3.2.0",
  "reflect-metadata": "^0.2.1",
  "rxjs": "^7.8.1",
  "class-validator": "^0.14.1",
  "class-transformer": "^0.5.1",
  // 기존 의존성 유지
  "axios": "^1.8.1",
  "firebase": "^11.4.0",
  "firebase-admin": "^13.1.0"
}
```

## 4. 기능별 변환 계획

### 4.1 Firebase 설정

현재 `firebase-admin-config.js`를 NestJS의 `FirebaseModule`로 변환하고 의존성 주입 방식으로 변경합니다.

### 4.2 노트 서비스

- `note-service.js` → `NotesService`로 변환
- RESTful API 엔드포인트를 `NotesController`로 구현
- DTO를 사용한 요청 데이터 검증 추가

### 4.3 코드 분석 서비스

- `openai-service.js` → `AnalysisService`로 변환
- 분석 관련 API를 `AnalysisController`로 구현
- 타임아웃 로직을 NestJS 방식으로 개선

### 4.4 통계 서비스

- `stats-service.js` → `StatsService`로 변환
- 통계 관련 API를 `StatsController`로 구현

## 5. 추가 개선사항

1. Guards를 사용한 인증 미들웨어 구현
2. 인터셉터를 통한 응답 형식 표준화
3. NestJS의 내장 예외 필터를 활용한 에러 처리 개선
4. 환경 변수 관리를 위한 ConfigModule 활용
5. API 문서화를 위한 Swagger 통합 고려
