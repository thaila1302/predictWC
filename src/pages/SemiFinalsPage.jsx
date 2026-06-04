import KnockoutRoundPage from '../components/KnockoutRoundPage';
import semiFinalsSeed from '../../data/semi-finals.json';

export default function SemiFinalsPage() {
  return (
    <KnockoutRoundPage
      roundKey="semi_finals"
      roundLabel="Bán kết"
      emptyTitle="Chưa có trận bán kết nào"
      emptyHint="Hãy nhập `data/semi-finals.json` hoặc dữ liệu Firestore tương ứng."
      seedData={semiFinalsSeed}
      teamNameOverride="Chờ đội"
    />
  );
}
