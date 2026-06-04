import KnockoutRoundPage from '../components/KnockoutRoundPage';
import roundOf32Seed from '../../data/1-16.json';

export default function KnockoutPage() {
  return (
    <KnockoutRoundPage
      roundKey="round_of_32"
      roundLabel="1/16"
      title="1/16"
      subtitle="Cac tran duoc nhom theo ngay va sap theo moc thoi gian gan nhat."
      emptyTitle="Chua co tran 1/16 nao"
      emptyHint="Hay import `data/1-16.json` hoac du lieu Firestore tuong ung."
      seedData={roundOf32Seed}
    />
  );
}
