require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { analyzeCode } = require("./openai-service");
const bodyParser = require("body-parser");

const noteService = require("./note-service");
const { firestore, admin } = require("./firebase-admin-config");

const app = express();
const PORT = process.env.PORT || 4000;

// 미들웨어 설정
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://dev-study-mate.vercel.app"]
        : "http://localhost:3000",
    credentials: true,
  })
);
app.use(bodyParser.json({ limit: "10mb" }));
app.use(express.json());

// 상태 확인 엔드포인트
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// 노트 API 엔드포인트
// 노트 생성 API
app.post("/api/note", async (req, res) => {
  try {
    const data = req.body;

    if (!data.userId || !data.title || !data.fileName) {
      return res.status(400).json({ error: "필수 필드가 누락되었습니다." });
    }

    const noteId = await noteService.createNote(data);
    return res.status(201).json({ id: noteId });
  } catch (error) {
    console.error("노트 생성 API 오류:", error);
    return res.status(500).json({ error: "노트 생성 중 오류가 발생했습니다." });
  }
});

// 노트 목록 조회 API
app.get("/api/note", async (req, res) => {
  try {
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({ error: "사용자 ID가 필요합니다." });
    }

    const notes = await noteService.getUserNotes(userId);
    return res.json({ notes });
  } catch (error) {
    console.error("노트 목록 조회 API 오류:", error);
    return res
      .status(500)
      .json({ error: "노트 목록을 가져오는 중 오류가 발생했습니다." });
  }
});

// 노트 상세 조회 API
app.get("/api/note/:id", async (req, res) => {
  try {
    const noteId = req.params.id;
    const note = await noteService.getNoteById(noteId);

    if (!note) {
      return res.status(404).json({ error: "노트를 찾을 수 없습니다." });
    }

    return res.json({ note });
  } catch (error) {
    console.error("노트 상세 조회 API 오류:", error);
    return res
      .status(500)
      .json({ error: "노트를 가져오는 중 오류가 발생했습니다." });
  }
});

// 노트 업데이트 API
app.put("/api/note/:id", async (req, res) => {
  try {
    const noteId = req.params.id;
    const noteData = req.body;

    await noteService.updateNote(noteId, noteData);
    return res.json({ success: true });
  } catch (error) {
    console.error("노트 업데이트 API 오류:", error);
    return res
      .status(500)
      .json({ error: "노트 업데이트 중 오류가 발생했습니다." });
  }
});

// 노트 삭제 API
app.delete("/api/note/:id", async (req, res) => {
  try {
    const noteId = req.params.id;
    await noteService.deleteNote(noteId);
    return res.json({ success: true });
  } catch (error) {
    console.error("노트 삭제 API 오류:", error);
    return res.status(500).json({ error: "노트 삭제 중 오류가 발생했습니다." });
  }
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
