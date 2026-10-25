ALTER TABLE "Comment" DROP CONSTRAINT "Comment_contentId_fkey";
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Reaction" DROP CONSTRAINT "Reaction_contentId_fkey";
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "View" DROP CONSTRAINT "View_contentId_fkey";
ALTER TABLE "View" ADD CONSTRAINT "View_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReadingHistory" DROP CONSTRAINT "ReadingHistory_contentId_fkey";
ALTER TABLE "ReadingHistory" ADD CONSTRAINT "ReadingHistory_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;
