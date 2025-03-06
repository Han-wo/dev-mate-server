const { firestore } = require("./firebase-admin-config");
const { FieldValue } = require("firebase-admin/firestore");

/**
 * 학습 노트 생성
 */
async function createNote(note) {
  try {
    console.log("노트 저장 시도:", JSON.stringify(note));

    if (!note.userId) {
      throw new Error("사용자 ID가 필요합니다.");
    }

    // 직렬화 가능한 형태로 데이터 정리
    const cleanedNote = JSON.parse(JSON.stringify(note));

    // 서브컬렉션 방식으로 변경: users/{userId}/notes/{noteId}
    const userNotesRef = firestore
      .collection("users")
      .doc(note.userId)
      .collection("notes");

    // userId 필드는 서브컬렉션에 포함하지 않음 (경로에 이미 포함)
    const { userId, ...noteData } = cleanedNote;

    const docRef = await userNotesRef.add({
      ...noteData,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log("노트 저장 성공. 문서 ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("노트 생성 중 오류 상세:", error);
    console.error("오류 스택:", error.stack);
    throw new Error(`노트 생성 중 오류가 발생했습니다: ${error.message}`);
  }
}

/**
 * 특정 사용자의 모든 학습 노트 조회
 */
async function getUserNotes(userId) {
  try {
    // 서브컬렉션에서 사용자의 노트 조회
    const userNotesRef = firestore
      .collection("users")
      .doc(userId)
      .collection("notes");
    const snapshot = await userNotesRef.orderBy("createdAt", "desc").get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();

      // Firestore 타임스탬프를 ISO 문자열로 변환
      const createdAt = data.createdAt
        ? data.createdAt.toDate().toISOString()
        : null;
      const updatedAt = data.updatedAt
        ? data.updatedAt.toDate().toISOString()
        : null;

      return {
        id: doc.id,
        userId, // 클라이언트 측 호환성을 위해 userId 추가
        ...data,
        createdAt,
        updatedAt,
      };
    });
  } catch (error) {
    console.error("노트 목록 조회 중 오류:", error);
    throw new Error("노트 목록을 가져오는 중 오류가 발생했습니다.");
  }
}

/**
 * 특정 학습 노트 조회
 */
async function getNoteById(userId, noteId) {
  try {
    // 서브컬렉션에서 특정 노트 조회
    const noteRef = firestore
      .collection("users")
      .doc(userId)
      .collection("notes")
      .doc(noteId);
    const docSnap = await noteRef.get();

    if (docSnap.exists) {
      const data = docSnap.data();

      // Firestore 타임스탬프를 ISO 문자열로 변환
      const createdAt = data.createdAt
        ? data.createdAt.toDate().toISOString()
        : null;
      const updatedAt = data.updatedAt
        ? data.updatedAt.toDate().toISOString()
        : null;

      return {
        id: docSnap.id,
        userId, // 클라이언트 측 호환성을 위해 userId 추가
        ...data,
        createdAt,
        updatedAt,
      };
    }
    return null;
  } catch (error) {
    console.error("노트 조회 중 오류:", error);
    throw new Error("노트를 가져오는 중 오류가 발생했습니다.");
  }
}

/**
 * 학습 노트 업데이트
 */
async function updateNote(userId, noteId, noteData) {
  try {
    // 직렬화 가능한 형태로 데이터 정리
    const cleanedNoteData = JSON.parse(JSON.stringify(noteData));

    // userId 필드 제거 (경로에 이미 포함)
    const { userId: _, ...updateData } = cleanedNoteData;

    // 서브컬렉션의 노트 업데이트
    const noteRef = firestore
      .collection("users")
      .doc(userId)
      .collection("notes")
      .doc(noteId);
    await noteRef.update({
      ...updateData,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("노트 업데이트 중 오류:", error);
    throw new Error("노트 업데이트 중 오류가 발생했습니다.");
  }
}

/**
 * 학습 노트 삭제
 */
async function deleteNote(userId, noteId) {
  try {
    // 서브컬렉션의 노트 삭제
    const noteRef = firestore
      .collection("users")
      .doc(userId)
      .collection("notes")
      .doc(noteId);
    await noteRef.delete();
    return true;
  } catch (error) {
    console.error("노트 삭제 중 오류:", error);
    throw new Error("노트 삭제 중 오류가 발생했습니다.");
  }
}

module.exports = {
  createNote,
  getUserNotes,
  getNoteById,
  updateNote,
  deleteNote,
};
