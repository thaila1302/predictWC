import KnockoutRoundPage from '../components/KnockoutRoundPage';
import quarterFinalsSeed from '../../data/quarter-finals.json';

export default function QuarterFinalsPage() {
  return (
    <KnockoutRoundPage
      roundKey="quarter_finals"
      roundLabel="Tứ kết"
      emptyTitle="Chưa có trận tứ kết nào"
      emptyHint="Hãy nhập `data/quarter-finals.json` hoặc dữ liệu Firestore tương ứng."
      seedData={quarterFinalsSeed}
      teamNameOverride="Chờ đội"
    />
  );
}
