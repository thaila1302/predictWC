import KnockoutRoundPage from '../components/KnockoutRoundPage';
import roundOf32Seed from '../../data/1-16.json';

export default function KnockoutPage() {
  return (
    <KnockoutRoundPage
      roundKey="round_of_32"
      roundLabel="1/16"
      emptyTitle="Chưa có trận 1/16 nào"
      emptyHint="Hãy nhập `data/1-16.json` hoặc dữ liệu Firestore tương ứng."
      seedData={roundOf32Seed}
    />
  );
}
