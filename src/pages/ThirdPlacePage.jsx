import KnockoutRoundPage from '../components/KnockoutRoundPage';
import thirdPlaceSeed from '../../data/third-place.json';

export default function ThirdPlacePage() {
  return (
    <KnockoutRoundPage
      roundKey="third_place"
      roundLabel="Hạng ba"
      title="Hạng ba"
      subtitle="Cac tran duoc nhom theo ngay va sap theo moc thoi gian gan nhat."
      emptyTitle="Chua co tran hang ba nao"
      emptyHint="Hay import `data/third-place.json` hoac du lieu Firestore tuong ung."
      seedData={thirdPlaceSeed}
      teamNameOverride="TBD"
    />
  );
}
