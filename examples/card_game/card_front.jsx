export default function CardFront({ record }) {
  return (
    <>
      <img
        src="images/front.pdf"
        style={{
          position: 'absolute',
          top: '-3mm',
          left: '-3mm',
          width: '69mm',
          height: '94mm',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: '3mm',
          right: '3mm',
          bottom: '3mm',
          left: '3mm',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexGrow: 0,
            flexBasis: '8mm',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'cmyk(100% 0% 0% 0%)',
            fontSize: '4mm',
            fontWeight: 'bold',
          }}
        >
          {record.name}
        </div>
        <img
          src="images/art.pdf"
          style={{
            width: '54mm',
            height: '34mm',
            flexGrow: 0,
            alignSelf: 'center',
          }}
        />
        <div
          style={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'cmyk(0% 0% 0% 100%)',
            textAlign: 'center',
            fontSize: '4mm',
          }}
        >
          {record.description.split('\\n').map((s, i) => (
            <div key={i} style={{ display: 'flex' }}>
              {s}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
