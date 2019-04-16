/**
 * Angular imports
 */
import { Injectable } from '@angular/core';

/**
 * 3rd party imports
 */
import { v4 as uuid } from 'uuid';
import { Observable, fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

/**
 * App imports
 */
import { ISize, IContentSize } from './browser-utilities.common';

/**
 * Returns native window object
 */
function _getWindow(): Window {
  return window;
}

/**
 * Returns native document object
 */
function _getDocument(): Document {
  return document;
}

/**
 * Window/browser service
 * @dynamic
 */
@Injectable({
  providedIn: 'root'
})
export class WindowService {
  private _resizeObs: Observable<Event>;

  /**
   * Constructor
   */
  constructor() {
    // observable for window resize
    this._resizeObs = fromEvent(this.window, 'resize').pipe(
      debounceTime(250)
    );
  }

  /**
   * Assigns an ID to this HTMLElement to indicate that it has been used in this service
   * @param elem HTMLElement
   */
  static assignIDToElement(elem: HTMLElement): string {
    if (elem) {
      // need to switch to any first in order to be able to check for our 
      // internal property
      const iElem: any = elem;

      if ((!iElem.ch__ID) || (iElem.ch__ID.trim() === '')) {
        iElem.ch__ID = uuid();
        return iElem.ch__ID;
      }

      return iElem.ch__ID;
    } else {
      return '';
    }
  }

  /**
   * Returns native window view port size
   */
  static getWindowSize(): ISize {
    return ({
      width: Math.round(_getWindow().innerWidth),
      height: Math.round(_getWindow().innerHeight)
    } as ISize);
  }

  /**
   * Returns HTML element size
   * @param elem HTML element
   */
  static getElementSize(elem: HTMLElement): ISize {
    const sizes: IContentSize[] = WindowService.getElementsSizes([elem]);

    if ((sizes) && (sizes.length === 1)) {
      return sizes[0].contentSize;
    } else {
      return ({ width: 0, height: 0 } as ISize);
    }
  }

  /**
   * Returns sizes for HTMLElements
   * @param elems Array of elements to calculate the sizes for
   */
  static getElementsSizes(elems: HTMLElement[]): IContentSize[] {
    const retVal: IContentSize[] = [];

    if (elems) {
      elems.forEach((val: HTMLElement) => {
        if ((val) && (val.getBoundingClientRect)) {
          // get size
          const elemSize = val.getBoundingClientRect();

          retVal.push({
            content: val,
            contentSize: {
              width: Math.round(elemSize.width),
              height: Math.round(elemSize.height)
            }
          });
        }
      });
    }

    return retVal;
  }

  /**
   * Gets resize event observable
   */
  get resizeEvent(): Observable<Event> {
    return this._resizeObs;
  }

  /**
   * Returns native window object
   */
  get window(): Window {
    return _getWindow();
  }

  /**
   * Returns native document object
   */
  get document(): Document {
    return _getDocument();
  }

  /**
   * Returns window client rectangle
   */
  get windowSize(): ISize {
    return WindowService.getWindowSize();
  }

  /**
   * Returns HTMLElement size
   * @param elem HTMLElement to get the size for
   */
  elementSize(elem: HTMLElement): ISize {
    return WindowService.getElementSize(elem);
  }

  /**
   * Returns HTMLElements sizes
   * @param elems Array of HTMLElement to get the sizes for
   */
  elementsSizes(elems: HTMLElement[]): IContentSize[] {
    return WindowService.getElementsSizes(elems);
  }
}
