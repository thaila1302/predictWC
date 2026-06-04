import KnockoutRoundPage from '../components/KnockoutRoundPage';
import roundOf16Seed from '../../data/1-8.json';

export default function RoundOf16Page() {
  return (
    <KnockoutRoundPage
      roundKey="round_of_16"
      roundLabel="1/8"
      title="1/8"
      subtitle="Cac tran duoc nhom theo ngay va sap theo moc thoi gian gan nhat."
      emptyTitle="Chua co tran 1/8 nao"
      emptyHint="Hay import `data/1-8.json` hoac du lieu Firestore tuong ung."
      seedData={roundOf16Seed}
      teamNameOverride="TBD"
    />
  );
}
