/**
 * Angular imports
 */
import { TestBed } from '@angular/core/testing';

/**
 * App imports
 */
import { AngularBrowserUtilitiesModule } from './angular-browser-utilities.module';
import { WindowService } from './window.service';

/**
 * Unittest for WindowService
 */
describe('WindowService', () => {
  let elem1: any;
  let elem2: any;
  let elem3: any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularBrowserUtilitiesModule
      ]
    });

    elem1 = {
      getBoundingClientRect: () => {
        return { width: 100, height: 200 };
      }
    };

    elem2 = {
      getBoundingClientRect: () => {
        return { width: 200, height: 100 };
      }
    };

    elem3 = {
      getBoundingClientRect: () => {
        return { width: 50, height: 50 };
      }
    };
  });

  /**
   * Create initial instance
   */
  it('should be created', () => {
    const service: WindowService = TestBed.get(WindowService);
    expect(service).toBeTruthy();
  });

  /**
   * Trigger window resize event
   */
  it('should return window resize event', (done) => {
    const service: WindowService = TestBed.get(WindowService);

    service.resizeEvent.subscribe((event) => {
      expect(event).toBeTruthy();
      expect(event.type).toBe('resize');
      done();
    });

    window.dispatchEvent(new Event('resize'));
  });

  /**
   * Valid window object
   */
  it('should return valid window object', () => {
    const service: WindowService = TestBed.get(WindowService);

    window.name = 'test';

    expect(service.window).toBeTruthy();
    expect(service.window.name).toBe('test');
  });

  /**
   * Valid document object
   */
  it('should return valid document object', () => {
    const service: WindowService = TestBed.get(WindowService);

    document.title = 'test';

    expect(service.document).toBeTruthy();
    expect(service.document.title).toBe('test');
  });

  /**
   * Returns window size
   */
  it('should return window size', () => {
    const service: WindowService = TestBed.get(WindowService);

    // current window size
    const winSize = {
      width: Math.round(window.innerWidth),
      height: Math.round(window.innerHeight)
    };

    const res = service.windowSize;

    expect(res).toEqual(winSize);
  });

  /**
   * Return element size
   */
  it('should return element size', () => {
    const service: WindowService = TestBed.get(WindowService);

    const res = service.elementSize(elem1);

    expect(res).toEqual(elem1.getBoundingClientRect());
  });

  /**
   * Return { width: 0, height: 0 } for null
   */
  it('should return { width: 0, height: 0 } for null', () => {
    const service: WindowService = TestBed.get(WindowService);

    // get from static
    const res = service.elementSize(null);

    expect(res).toEqual({ width: 0, height: 0 });
  });

  /**
   * Return elements sizes
   */
  it('should calculate elements sizes', () => {
    const service: WindowService = TestBed.get(WindowService);

    // elements
    const elems = [elem1, elem2, elem3];

    // manually calculate sizes
    const elemsSizes = [];
    elems.forEach((val) => {
      elemsSizes.push({
        content: val,
        contentSize: {
          width: val.getBoundingClientRect().width,
          height: val.getBoundingClientRect().height
        }
      });
    });

    // get sizes
    const sizes = service.elementsSizes(elems);

    expect(sizes).toBeTruthy();
    expect(sizes).toEqual(elemsSizes);
  });

  /**
   * Return elements sizes ignoring nulls
   */
  it('should calculate elements sizes and ignoring nulls', () => {
    const service: WindowService = TestBed.get(WindowService);

    // elements
    const elems = [elem1, elem2, elem3];

    // manually calculate sizes
    const elemsSizes = [];
    elems.forEach((val) => {
      elemsSizes.push({
        content: val,
        contentSize: {
          width: val.getBoundingClientRect().width,
          height: val.getBoundingClientRect().height
        }
      });
    });

    // get sizes
    const sizes = service.elementsSizes([...elems, null, null]);

    expect(sizes).toBeTruthy();
    expect(sizes).toEqual(elemsSizes);
  });

  /**
   * Unittests for static methods
   */
  describe('static methods', () => {
    /**
     * Assigns ID
     */
    it('should assigns .ch__ID property', () => {
      // test initial value
      expect(elem1.ch__ID).toBeUndefined();

      const id = WindowService.assignIDToElement(elem1);

      expect(elem1.ch__ID).toBe(id);
    });

    /**
     * Returns empty string whenc calling assignIDToElement() with null
     */
    it('should return empty string when calling .assignIDToElement() with null', () => {
      expect(WindowService.assignIDToElement(null)).toBe('');
    });

    /**
     * Not overwrite existing .ch__ID
     */
    it('should not overwrite existing .ch__ID', () => {
      // test initial value
      (elem1 as any).ch__ID = 'CHTEST';

      // assign
      const id = WindowService.assignIDToElement(elem1);

      expect(elem1.ch__ID).toBe('CHTEST');
    });

    /**
     * Assigns new ID if exist .ch__ID is null
     */
    it('should assign new ID if exist .ch__ID is null', () => {
      // test initial value
      (elem1 as any).ch__ID = null;

      // assign
      const id = WindowService.assignIDToElement(elem1);

      expect(elem1.ch__ID).toBeTruthy();
      expect(elem1.ch__ID).toBe(id);
    });

    /**
     * Assigns new ID if exist .ch__ID is empty string
     */
    it('should assign new ID if exist .ch__ID is empty string', () => {
      // test initial value
      (elem1 as any).ch__ID = '';

      // assign
      const id = WindowService.assignIDToElement(elem1);

      expect(elem1.ch__ID).toBeTruthy();
      expect(elem1.ch__ID).not.toBe('');
      expect(elem1.ch__ID).toBe(id);
    });

    /**
     * Returns window size
     */
    it('should return window size', () => {
      // current window size
      const winSize = {
        width: Math.round(window.innerWidth),
        height: Math.round(window.innerHeight)
      };

      // get from static
      const res = WindowService.getWindowSize();

      expect(res).toEqual(winSize);
    });

    /**
     * Return element size
     */
    it('should return element size', () => {
      // get from static
      const res = WindowService.getElementSize(elem1);

      expect(res).toEqual(elem1.getBoundingClientRect());
    });

    /**
     * Return { width: 0, height: 0 } for null
     */
    it('should return { width: 0, height: 0 } for null', () => {
      // get from static
      const res = WindowService.getElementSize(null);

      expect(res).toEqual({ width: 0, height: 0 });
    });

    /**
     * Return elements sizes
     */
    it('should calculate elements sizes', () => {
      // elements
      const elems = [elem1, elem2, elem3];

      // manually calculate sizes
      const elemsSizes = [];
      elems.forEach((val) => {
        elemsSizes.push({
          content: val,
          contentSize: {
            width: val.getBoundingClientRect().width,
            height: val.getBoundingClientRect().height
          }
        });
      });

      // get sizes
      const sizes = WindowService.getElementsSizes(elems);

      expect(sizes).toBeTruthy();
      expect(sizes).toEqual(elemsSizes);
    });

    /**
     * Return elements sizes ignoring nulls
     */
    it('should calculate elements sizes and ignoring nulls', () => {
      // elements
      const elems = [elem1, elem2, elem3];

      // manually calculate sizes
      const elemsSizes = [];
      elems.forEach((val) => {
        elemsSizes.push({
          content: val,
          contentSize: {
            width: val.getBoundingClientRect().width,
            height: val.getBoundingClientRect().height
          }
        });
      });

      // get sizes
      const sizes = WindowService.getElementsSizes([...elems, null, null]);

      expect(sizes).toBeTruthy();
      expect(sizes).toEqual(elemsSizes);
    });
  });
});
