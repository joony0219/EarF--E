import { Diary } from "../models/schemas/diary";

const boastService = {
  // _id를 이용해 shareStatus가 true인 단일 다이어리 게시글 찾기
  async loadSingleDiary(id: string) {
    try {
      const diary = await Diary.findOne({ _id: id, shareStatus: true });
      if (!diary) {
        throw new Error(
          "해당 ID를 가진 게시글이 존재하지 않거나 공유 상태가 아닙니다.",
        );
      }
      return diary;
    } catch (error) {
      console.error(error);
      throw new Error("다이어리 게시글을 불러오는데 실패했습니다.");
    }
  },

  // shareStatus가 true인 다이어리 찾기
  async loadBoast() {
    try {
      const diaries = await Diary.find({ shareStatus: true }).sort({
        createdAt: -1,
      });
      return diaries;
    } catch (error) {
      console.error(error);
      throw new Error("자랑하기 게시글을 불러오는데 실패했습니다.");
    }
  },

  //tag 검색 기능, tag.length가 1 이하인 게시글만 검색
  async searchByTag(tag: string | string[]) {
    try {
      let tags: string[] = [];

      if (typeof tag === "string") {
        tags = [tag];
      } else if (Array.isArray(tag)) {
        tags = tag;
      }

      const diaries = await Diary.find({
        shareStatus: true,
        tag: { $in: tags },
        $where: "this.tag.length <= 1",
      }).sort({ createdAt: -1 });

      return diaries;
    } catch (error) {
      console.error(error);
      throw new Error("태그 검색에 실패했습니다.");
    }
  },

  // shareStatus가 true인 다이어리 중에서 좋아요가 가장 많은 상위 5개의 다이어리 찾기
  async loadTop5Boast() {
    try {
      const diaries = await Diary.aggregate([
        { $match: { shareStatus: true } },
        {
          $addFields: {
            likeCount: {
              $cond: {
                if: { $isArray: "$likeIds" },
                then: { $size: "$likeIds" },
                else: 0,
              },
            },
          },
        },
        { $sort: { likeCount: -1 } },
        { $limit: 5 },
        { $project: { likeCount: 0 } },
      ]);
      return diaries;
    } catch (error) {
      console.error(error);
      throw new Error(
        "좋아요가 많은 상위 5개의 자랑하기 게시글을 불러오는데 실패했습니다.",
      );
    }
  },

  // 다이어리 게시글 좋아요 누르기 / 취소하기
  async toggleLike(diaryId: string, userId: string) {
    try {
      const diary = await Diary.findById(diaryId);
      if (!diary) {
        throw new Error("게시글을 찾을 수 없습니다.");
      }

      const likeIndex = diary.likeIds.indexOf(userId);
      if (likeIndex === -1) {
        diary.likeIds.push(userId);
      } else {
        diary.likeIds.splice(likeIndex, 1);
      }
      await diary.save();
      return diary;
    } catch (error) {
      console.error(error);
      throw new Error("다이어리 게시글 좋아요 기능 처리에 실패하였습니다.");
    }
  },
};

export default boastService;