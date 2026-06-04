import KnockoutRoundPage from '../components/KnockoutRoundPage';
import finalSeed from '../../data/final.json';

export default function FinalPage() {
  return (
    <KnockoutRoundPage
      roundKey="final"
      roundLabel="Chung kết"
      emptyTitle="Chưa có trận chung kết nào"
      emptyHint="Hãy nhập `data/final.json` hoặc dữ liệu Firestore tương ứng."
      seedData={finalSeed}
      teamNameOverride="Chờ đội"
    />
  );
}
