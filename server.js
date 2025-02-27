require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { analyzeCode } = require("./openai-service");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 4000;

// 미들웨어 설정
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://yourfrontend.com"] // 프로덕션 환경에서의 클라이언트 URL
        : "http://localhost:3000", // 개발 환경에서의 클라이언트 URL
    credentials: true,
  })
);
app.use(bodyParser.json({ limit: "10mb" })); // 요청 본문 크기 제한 증가
app.use(express.json());

// 상태 확인 엔드포인트
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// 코드 분석 엔드포인트
app.post("/api/analyze", async (req, res) => {
  try {
    const { fileName, fileContent } = req.body;

    if (!fileName || !fileContent) {
      return res.status(400).json({ error: "파일 이름과 내용이 필요합니다." });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ error: "OpenAI API 키가 설정되지 않았습니다." });
    }

    console.log(`분석 요청 받음: ${fileName}`);
    const startTime = Date.now();

    // 타임아웃 설정
    const timeoutPromise = new Promise(
      (_, reject) =>
        setTimeout(() => reject(new Error("분석 시간 초과")), 60000) // 60초 타임아웃
    );

    // 분석 요청과 타임아웃 경쟁
    const analysis = await Promise.race([
      analyzeCode(apiKey, fileName, fileContent),
      timeoutPromise,
    ]);

    const endTime = Date.now();
    console.log(
      `분석 완료: ${fileName} (소요시간: ${(endTime - startTime) / 1000}초)`
    );

    return res.json({ analysis });
  } catch (error) {
    console.error("분석 API 오류:", error);

    // 타임아웃 에러 처리
    if (error.message === "분석 시간 초과") {
      return res.status(504).json({
        error: "분석 시간이 초과되었습니다. 나중에 다시 시도해주세요.",
      });
    }

    return res.status(500).json({ error: "파일 분석 중 오류가 발생했습니다." });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
