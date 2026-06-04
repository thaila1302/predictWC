import KnockoutRoundPage from '../components/KnockoutRoundPage';
import semiFinalsSeed from '../../data/semi-finals.json';

export default function SemiFinalsPage() {
  return (
    <KnockoutRoundPage
      roundKey="semi_finals"
      roundLabel="Bán kết"
      title="Bán kết"
      subtitle="Cac tran duoc nhom theo ngay va sap theo moc thoi gian gan nhat."
      emptyTitle="Chua co tran ban ket nao"
      emptyHint="Hay import `data/semi-finals.json` hoac du lieu Firestore tuong ung."
      seedData={semiFinalsSeed}
      teamNameOverride="TBD"
    />
  );
}
