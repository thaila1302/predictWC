import KnockoutRoundPage from '../components/KnockoutRoundPage';
import roundOf16Seed from '../../data/1-8.json';

export default function RoundOf16Page() {
  return (
    <KnockoutRoundPage
      roundKey="round_of_16"
      roundLabel="1/8"
      emptyTitle="Chưa có trận 1/8 nào"
      emptyHint="Hãy nhập `data/1-8.json` hoặc dữ liệu Firestore tương ứng."
      seedData={roundOf16Seed}
      teamNameOverride="Chờ đội"
    />
  );
}
