import KnockoutRoundPage from '../components/KnockoutRoundPage';
import finalSeed from '../../data/final.json';

export default function FinalPage() {
  return (
    <KnockoutRoundPage
      roundKey="final"
      roundLabel="Chung kết"
      title="Chung kết"
      subtitle="Cac tran duoc nhom theo ngay va sap theo moc thoi gian gan nhat."
      emptyTitle="Chua co tran chung ket nao"
      emptyHint="Hay import `data/final.json` hoac du lieu Firestore tuong ung."
      seedData={finalSeed}
      teamNameOverride="TBD"
    />
  );
}
