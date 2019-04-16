/**
 * Angular imports
 */
import { TestBed } from '@angular/core/testing';

/**
 * App imports
 */
import { IAvailableSize, IContentSize } from './browser-utilities.common';
import { WindowService } from './window.service';
import { ContainerHeightService } from './container-height.service';

/**
 * Returns default window available size
 */
function getMockWinAvailableSize(): IAvailableSize {
  const winSize: IAvailableSize = {
    containerSize: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    contents: [],
    selectedContent: null,
    width: window.innerWidth,
    height: window.innerHeight
  };

  return winSize;
}

/**
 * Returns default element available size
 */
function getMockElementAvailableSize(elem): IAvailableSize {
  const size = elem.getBoundingClientRect();

  const elemSize: IAvailableSize = {
    containerSize: {
      width: size.width,
      height: size.height
    },
    contents: [],
    selectedContent: null,
    width: size.width,
    height: size.height
  };

  return elemSize;
}

/**
 * Returns default HTMLElementSize
 * @param elem Mock HTMLElement
 */
function getMockElemSize(elem): IContentSize {
  const elemSize: IContentSize = {
    content: elem,
    contentSize: {
      width: elem.getBoundingClientRect().width,
      height: elem.getBoundingClientRect().height
    }
  };

  return elemSize;
}


/**
 * Unittests for AvailableHeightService
 * Note: We should use mock of WindowService to ensure we are only testing AvailableHeightService
 */
describe('AvailableHeightService', () => {
  let service: ContainerHeightService;
  let browserSvc: WindowService;

  let elem1: any;
  let elem2: any;
  let elem3: any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [

      ]
    });

    browserSvc = new WindowService();
    service = new ContainerHeightService(browserSvc);

    elem1 = {
      getBoundingClientRect: () => {
        const size = { width: 0, height: 0 };

        size.width = elem1.offsetWidth;
        size.height = elem1.offsetHeight;

        return size;
      },
      offsetHeight: 200,
      offsetWidth: 200
    };

    elem2 = {
      getBoundingClientRect: () => {
        const size = { width: 0, height: 0 };

        size.width = elem2.offsetWidth;
        size.height = elem2.offsetHeight;

        return size;
      },
      offsetHeight: 100,
      offsetWidth: 200
    };

    elem3 = {
      getBoundingClientRect: () => {
        const size = { width: 0, height: 0 };

        size.width = elem3.offsetWidth;
        size.height = elem3.offsetHeight;

        return size;
      },
      offsetHeight: 50,
      offsetWidth: 50
    };
  });

  /**
   * Create initial instance
   */
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  /**
   * Return element size
   */
  it('should return element size', () => {
    const size = {
      width: elem1.getBoundingClientRect().width,
      height: elem1.getBoundingClientRect().height
    };

    const res = service.getElementSize(elem1);

    expect(res).toBeTruthy();
    expect(res).toEqual(size);
  });

  /**
   * Returns container count
   */
  it('should return 2 as container count', () => {
    service.addContainer();
    service.addContainer('testcontainer', elem1);

    expect(service.containersCount).toBe(2);
  });

  /**
   * .addContainer() throws exception for invalid name
   */
  it('should throw exception if name is empty when calling .addContainer()', () => {
    expect(() => {
      service.addContainer('');
    }).toThrowError('Invalid container name -- ');
  });

  /**
   * .addContainer() throws exception for invalid name
   */
  it('should throw exception if name is null when calling .addContainer()', () => {
    expect(() => {
      service.addContainer(null);
    }).toThrowError('Invalid container name -- null');
  });

  /**
   * Trigger event from WindowService due to window resize
   */
  it('should trigger an event when window resize event', (done) => {
    // trigger window resize event
    window.dispatchEvent(new Event('resize'));

    const sub = service.addContainer('window').containerSizeEvent.subscribe((val: IAvailableSize) => {
      expect(val).toBeTruthy();
      done();
    });

    setTimeout(() => {
      sub.unsubscribe();
    }, service.INTERVALISMS + 10);
  });

  /**
   * Remove content from container
   */
  it('should remove content from container', () => {
    const cont = service.addContainer();

    const elem1Rem = cont.addContent(elem1);
    const elem2Rem = cont.addContent(elem2);

    expect(cont.contains(elem1)).toBeTruthy();
    expect(cont.contains(elem2)).toBeTruthy();

    elem2Rem();

    expect(cont.contains(elem2)).toBeFalsy();
  });

  /**
   * Trigger event manually
   */
  it('should trigger event when manually triggered', (done) => {
    // create new service here so that all triggers (observables)
    // are not running yet
    const newSvc = new ContainerHeightService(browserSvc);

    const cont = newSvc.addContainer();

    let callCount = 0;

    const sub = cont.containerSizeEvent.subscribe((availSize: IAvailableSize) => {
      ++callCount;
    });

    newSvc.triggerEvent();

    // service has 2 other triggers - window resize and interval
    // using timeout here at 1ms to ensure trigger from the manual
    setTimeout(() => {
      expect(callCount).toBe(1);

      done();

      sub.unsubscribe();
    }, 1);
  });

  /**
   * Returns undefined if parameter to getContainer() is null
   */
  it('should return undefined calling getContainer() with null', () => {
    const cont = service.getContainer(null);

    expect(cont).toBeUndefined();
  });

  /**
   * Unittest for "window" container
   */
  describe('"window" container', () => {
    /**
     * Default to add window container
     */
    it('should be "window" container when called with no parameters', () => {
      service.addContainer();

      const cont = service.getContainer('window');

      expect(cont).toBeTruthy();
      expect(cont.name).toBe('window');
      expect(cont.containerElement).toBeNull();
    });

    /**
     * Add window container with name = 'window'
     */
    it('should be "window" container if name = \'window\'', () => {
      service.addContainer('window');

      const cont = service.getContainer('window');

      expect(cont).toBeTruthy();
      expect(cont.name).toBe('window');
      expect(cont.containerElement).toBeNull();
    });

    /**
     * Add window container with name = '<anything>' but contElem parameter is set to null or missing
     */
    it('should be "window" container if containerElem is set to null regardless of name', () => {
      service.addContainer('coolname', null);

      const cont = service.getContainer('window');

      expect(cont).toBeTruthy();
      expect(cont.name).toBe('window');
      expect(cont.containerElement).toBeNull();
    });

    /**
     * Add window container when name is "window" and element is an HTMLElement
     */
    it('should be "window" container if containerElem is set to null regardless of name', () => {
      service.addContainer('window', elem1);

      const cont = service.getContainer('window');

      expect(cont).toBeTruthy();
      expect(cont.name).toBe('window');
      expect(cont.containerElement).toBeNull();
    });

    /**
     * Restricts to one "window" container
     */
    it('should be only 1 "window" container', () => {
      // these 3 calls will suppose to create window container
      service.addContainer();
      service.addContainer('window');
      service.addContainer('newcontainer');

      expect(service.containersCount).toBe(1);
    });

    /**
     * Available size should be window viewport size when no content in the group
     */
    it('should return window size as available size without any contents', (done) => {
      // get window size
      const winSize = getMockWinAvailableSize();

      service.addContainer();

      const cont = service.getContainer('window');

      // subscribe to resize event
      const sub = cont.availableSizeEvent.subscribe((availSize: IAvailableSize) => {
        expect(availSize).toEqual(winSize);
        done();
      });

      setTimeout(() => {
        sub.unsubscribe();
      }, service.INTERVALISMS + 10);
    });

    /**
     * Tallest content should not be triggered when no content in the group
     */
    it('should not trigger tallest content without any contents', (done) => {
      service.addContainer();

      const cont = service.getContainer('window');

      // call count
      let callCount = 0;

      // subscribe to resize event
      const sub = cont.tallestContentEvent.subscribe((availSize: IAvailableSize) => {
        ++callCount;
      });

      // wait for a bit so that we can check if event was triggered
      setTimeout(() => {
        expect(callCount).toBe(0);

        sub.unsubscribe();

        done();
      }, service.INTERVALISMS + 10);
    });

    /**
     * Returns available size
     */
    it('should return available size', (done) => {
      service.addContainer();

      const cont = service.getContainer('window');

      cont.addContent(elem1 as HTMLElement);
      cont.addContent(elem2 as HTMLElement);

      // subscribe to resize event
      const sub = cont.availableSizeEvent.subscribe((availSize: IAvailableSize) => {
        // expected available size
        const expectedSize = getMockWinAvailableSize();

        expectedSize.contents = [];
        expectedSize.contents.push(getMockElemSize(elem1));
        expectedSize.contents.push(getMockElemSize(elem2));

        expectedSize.selectedContent = null;

        expectedSize.width = (window.innerWidth - (elem1.getBoundingClientRect().width + elem2.getBoundingClientRect().width));
        expectedSize.height = (window.innerHeight - (elem1.getBoundingClientRect().height + elem2.getBoundingClientRect().height));

        expect(availSize).toEqual(expectedSize);
        done();
      });

      setTimeout(() => {
        sub.unsubscribe();
      }, service.INTERVALISMS + 10);
    });

    /**
     * Returns tallest content
     */
    it('should trigger tallest content', (done) => {
      service.addContainer();

      // dummy up ch__ID
      elem1.ch__ID = 'elem1';
      elem2.ch__ID = 'elem2';

      const cont = service.getContainer('window');

      cont.addContent(elem1 as HTMLElement);
      cont.addContent(elem2 as HTMLElement);

      // subscribe to tallest content event
      const sub = cont.tallestContentEvent.subscribe((availSize: IAvailableSize) => {
        expect(availSize).toBeTruthy();
        expect(availSize.selectedContent.content).toEqual(elem1);

        done();
      });

      setTimeout(() => {
        sub.unsubscribe();
      }, service.INTERVALISMS + 10);
    });

    /**
     * Triggers tallest content for the same element
     */
    it('should trigger tallest content for the same element when height changed', (done) => {
      service.addContainer();

      // dummy up ch__ID
      elem1.ch__ID = 'elem1';
      elem2.ch__ID = 'elem2';

      const cont = service.getContainer('window');

      cont.addContent(elem1 as HTMLElement);
      cont.addContent(elem2 as HTMLElement);

      const tallest = elem1;
      let callCount = 0;

      // subscribe to tallest content event
      const sub = cont.tallestContentEvent.subscribe((availSize: IAvailableSize) => {
        ++callCount;

        expect(availSize).toBeTruthy();
        expect(availSize.selectedContent.content).toEqual(tallest);
      });

      setTimeout(() => {
        expect(callCount).toBe(1);

        tallest.offsetHeight = 500;

        setTimeout(() => {
          expect(callCount).toBe(2);

          done();

          sub.unsubscribe();
        }, service.INTERVALISMS + 10);
      }, service.INTERVALISMS + 10);
    });

    /**
     * Returns available height and tallest content
     */
    it('should trigger available height and tallest content', (done) => {
      service.addContainer();

      let availHeightCalled: number = 0;
      let tallestContentCalled: number = 0;

      // dummy up ch__ID
      elem1.ch__ID = 'elem1';
      elem2.ch__ID = 'elem2';

      const cont = service.getContainer('window');

      cont.addContent(elem1 as HTMLElement);
      cont.addContent(elem2 as HTMLElement);

      // subscribe to resize event
      const sub1 = cont.availableSizeEvent.subscribe((availSize: IAvailableSize) => {
        ++availHeightCalled;

        // expected available size
        const expectedSize = getMockWinAvailableSize();

        expectedSize.contents = [];
        expectedSize.contents.push(getMockElemSize(elem1));
        expectedSize.contents.push(getMockElemSize(elem2));

        expectedSize.selectedContent = null;

        expectedSize.width = (window.innerWidth - (elem1.getBoundingClientRect().width + elem2.getBoundingClientRect().width));
        expectedSize.height = (window.innerHeight - (elem1.getBoundingClientRect().height + elem2.getBoundingClientRect().height));

        expect(availSize).toEqual(expectedSize);
      });

      // subscribe to resize event
      const sub2 = cont.tallestContentEvent.subscribe((availSize: IAvailableSize) => {
        ++tallestContentCalled;

        expect(availSize).toBeTruthy();
        expect(availSize.selectedContent).toBeTruthy();
        expect(availSize.selectedContent.content).toEqual(elem1);
      });

      // wait to check result
      setTimeout(() => {
        expect(availHeightCalled).toBe(1);
        expect(tallestContentCalled).toBe(1);

        done();

        sub1.unsubscribe();
        sub2.unsubscribe();
      }, service.INTERVALISMS + 10);
    });
  });

  /**
   * Unittest for HTMLElement container
   */
  describe('HTMLElement container', () => {
    /**
     * Adds a container with HTMLElement
     */
    it('should add container with name "testcontainer"', (done) => {
      // add container
      service.addContainer('testcontainer', elem1);

      // get it back
      const cont = service.getContainer('testcontainer');
      expect(cont).toBeTruthy();

      // subscribe
      const sub = cont.availableSizeEvent.subscribe((availSize: IAvailableSize) => {
        expect(availSize).toEqual(getMockElementAvailableSize(elem1));
        done();
      });

      setTimeout(() => {
        sub.unsubscribe();
      }, service.INTERVALISMS + 10);
    });

    /**
     * Container name is unique
     */
    it('should be 1 container for the same name', (done) => {
      // add container
      service.addContainer('testcontainer', elem1);
      service.addContainer('testcontainer', elem2);

      // get it back
      const cont = service.getContainer('testcontainer');
      expect(cont).toBeTruthy();

      expect(service.containersCount).toBe(1);

      // subscribe
      const sub = cont.availableSizeEvent.subscribe((availSize: IAvailableSize) => {
        expect(availSize).toEqual(getMockElementAvailableSize(elem1));
        done();
      });

      setTimeout(() => {
        sub.unsubscribe();
      }, service.INTERVALISMS + 10);
    });

    /**
     * Triggers resize event for multiple containers
     */
    it('should trigger resize event for multiple containers', (done) => {
      // add container
      service.addContainer('testcontainer1', elem1);
      service.addContainer('testcontainer2', elem2);

      // get it back
      const cont = service.getContainer('testcontainer1');
      expect(cont).toBeTruthy();

      const cont2 = service.getContainer('testcontainer2');
      expect(cont2).toBeTruthy();

      expect(service.containersCount).toBe(2);

      // call count
      let callCount: number = 0;

      // subscribe
      const sub1 = cont.availableSizeEvent.subscribe((availSize: IAvailableSize) => {
        expect(availSize).toEqual(getMockElementAvailableSize(elem1));
        ++callCount;
      });

      const sub2 = cont2.availableSizeEvent.subscribe((availSize: IAvailableSize) => {
        expect(availSize).toEqual(getMockElementAvailableSize(elem2));
        ++callCount;
      });

      // use setTimeout to wait for interval to elapsed - expect 2 calls made since no changes have been made since 
      // last availablesize calculation
      setTimeout(() => {
        expect(callCount).toBe(2);
        done();

        sub1.unsubscribe();
        sub2.unsubscribe();
      }, service.INTERVALISMS + 1);
    });

    /**
     * Should return available size
     */
    it('should return available size', (done) => {
      // add container
      service.addContainer('testcontainer', elem1);

      // get it back
      const cont = service.getContainer('testcontainer');
      expect(cont).toBeTruthy();

      cont.addContent(elem2);

      // subscribe
      const sub = cont.availableSizeEvent.subscribe((availSize: IAvailableSize) => {
        const expectedSize = getMockElementAvailableSize(elem1);
        const size = elem1.getBoundingClientRect();

        expectedSize.contents = [];
        expectedSize.contents.push(getMockElemSize(elem2));

        expectedSize.width = size.width - elem2.getBoundingClientRect().width;
        expectedSize.height = size.height - elem2.getBoundingClientRect().height;

        expect(availSize).toEqual(expectedSize);
        done();

        sub.unsubscribe();
      });
    });

    /**
     * Should trigger events after content changes
     */
    it('should return available size after changes', (done) => {
      // default expected size
      const expectedSize = getMockElementAvailableSize(elem1);

      // add container
      service.addContainer('testcontainer', elem1);

      // get it back
      const cont = service.getContainer('testcontainer');
      expect(cont).toBeTruthy();

      // update expected result
      expectedSize.contents = [];
      expectedSize.contents.push(getMockElemSize(elem2));
      expectedSize.width -= elem2.getBoundingClientRect().width;
      expectedSize.height -= elem2.getBoundingClientRect().height;

      cont.addContent(elem2);

      // call count
      let callCount: number = 0;

      // subscribe
      const sub = cont.availableSizeEvent.subscribe((availSize: IAvailableSize) => {
        expect(availSize).toEqual(expectedSize);

        ++callCount;
      });

      // wait for service.INTERVALISMS + 10 - add another element
      setTimeout(() => {
        expectedSize.contents.push(getMockElemSize(elem3));
        expectedSize.width -= elem3.getBoundingClientRect().width;
        expectedSize.height -= elem3.getBoundingClientRect().height;

        cont.addContent(elem3);
      }, service.INTERVALISMS + 10);

      // wait for service.INTERVALISMS * 2 - to verify there should be 2 calls
      setTimeout(() => {
        expect(callCount).toBe(2);
        done();

        sub.unsubscribe();
      }, service.INTERVALISMS * 2);
    });

    /**
     * Returns tallest content
     */
    it('should trigger tallest content', (done) => {
      service.addContainer('tallestcontent', elem1);

      // dummy up ch__ID
      elem2.ch__ID = 'elem2';
      elem3.ch__ID = 'elem3';

      const cont = service.getContainer('tallestcontent');

      cont.addContent(elem3 as HTMLElement);
      cont.addContent(elem2 as HTMLElement);

      // subscribe to tallest content event
      const sub = cont.tallestContentEvent.subscribe((availSize: IAvailableSize) => {
        expect(availSize).toBeTruthy();
        expect(availSize.selectedContent.content).toEqual(elem2);

        done();
      });

      setTimeout(() => {
        sub.unsubscribe();
      }, service.INTERVALISMS + 10);
    });
  });
});
