import KnockoutRoundPage from '../components/KnockoutRoundPage';
import quarterFinalsSeed from '../../data/quarter-finals.json';

export default function QuarterFinalsPage() {
  return (
    <KnockoutRoundPage
      roundKey="quarter_finals"
      roundLabel="Tứ kết"
      title="Tứ kết"
      subtitle="Cac tran duoc nhom theo ngay va sap theo moc thoi gian gan nhat."
      emptyTitle="Chua co tran tu ket nao"
      emptyHint="Hay import `data/quarter-finals.json` hoac du lieu Firestore tuong ung."
      seedData={quarterFinalsSeed}
      teamNameOverride="TBD"
    />
  );
}
