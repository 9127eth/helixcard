import { NextPage } from 'next';
import Head from 'next/head';
import { db } from '@/app/lib/firebase-admin';

interface BusinessCardData {
  id?: string;  // Add this line
  name: string;
  jobTitle: string;
  company: string;
  email: string;
  phoneNumber: string;
  // Add other fields as necessary
}

interface BusinessCardPageProps {
  params: { username: string };
}

const BusinessCardPage: NextPage<BusinessCardPageProps> = async ({ params }) => {
  const { username } = params;

  try {
    // Find user by username
    const userQuery = db.collection('users').where('username', '==', username);
    const userSnapshot = await userQuery.get();

    if (userSnapshot.empty) {
      return <div>Error: User not found</div>;
    }

    const userDoc = userSnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();

    // Fetch primary business card
    if (!userData.primaryCardId) {
      return <div>Error: Primary business card not set</div>;
    }
    const cardRef = db.collection('users').doc(userId).collection('businessCards').doc(userData.primaryCardId);
    const cardDoc = await cardRef.get();

    if (!cardDoc.exists) {
      return <div>Error: Primary business card not found</div>;
    }

    const cardData = cardDoc.data() as BusinessCardData;

    return (
      <>
        <Head>
          <title>{cardData.name}&apos;s Business Card - HelixCard</title>
          <meta name="description" content={`${cardData.name}'s digital business card`} />
        </Head>
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl">
          <h1 className="text-2xl font-bold mb-4">{cardData.name}</h1>
          <p className="text-gray-600">{cardData.jobTitle}</p>
          <p className="text-gray-600">{cardData.company}</p>
          <div className="mt-4">
            <p>Email: {cardData.email}</p>
            <p>Phone: {cardData.phoneNumber}</p>
          </div>
          {/* Add more card details here */}
        </div>
      </>
    );
  } catch (error) {
    console.error('Error fetching business card:', error);
    return <div>Error: Internal server error</div>;
  }
};

export default BusinessCardPage;
