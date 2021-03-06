import {AdvertisingPersistenceLayer} from './AdvertisingPersistenceLayer';
import {DefaultPersistenceLayer} from '../DefaultPersistenceLayer';
import {MemoryDatastore} from '../MemoryDatastore';
import {MockDocMetas} from '../../metadata/DocMetas';
import {IDocInfo} from '../../metadata/DocInfo';
import {assertJSON} from '../../test/Assertions';
import {MockAdvertisingPersistenceLayer} from './MockAdvertisingPersistenceLayer';
import {TestingTime} from '../../test/TestingTime';

TestingTime.freeze();

describe('AdvertisingPersistenceLayer', function() {

    it("addEventListenerForDoc", async function() {

        const defaultPersistenceLayer
            = new DefaultPersistenceLayer(new MemoryDatastore());

        const advertisingPersistenceLayer
            = new MockAdvertisingPersistenceLayer(defaultPersistenceLayer);

        const docMeta0 = MockDocMetas.createWithinInitialPagemarks('0x001', 1);
        const docMeta1 = MockDocMetas.createWithinInitialPagemarks('0x002', 1);

        const advertised: IDocInfo[] = [];

        await advertisingPersistenceLayer.init();

        advertisingPersistenceLayer.addEventListenerForDoc('0x001', event => {
            advertised.push(event.docInfo);
        });

        await advertisingPersistenceLayer.syncDocMeta(docMeta0);
        await advertisingPersistenceLayer.syncDocMeta(docMeta1);

        const expected: IDocInfo[] = [
            <IDocInfo> {
                "progress": 100,
                "pagemarkType": "SINGLE_COLUMN",
                "properties": {},
                "archived": false,
                "flagged": false,
                "tags": {},
                "nrPages": 1,
                "fingerprint": "0x001",
                "added": "2012-03-02T11:38:49.321Z"
            }
        ];

        assertJSON(advertised, expected);

    });

});
