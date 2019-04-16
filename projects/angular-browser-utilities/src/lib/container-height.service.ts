/**
 * Angular imports
 */
import { Injectable } from '@angular/core';

/**
 * 3rd party imports
 */
import { v4 as uuid } from 'uuid';
import { Observable, Subject, interval, BehaviorSubject } from 'rxjs';
import { map, merge, filter } from 'rxjs/operators';

/**
 * App imports
 */
import { AngularBrowserUtilitiesModule } from './angular-browser-utilities.module';
import { ISize, IContainer, IAvailableSize, IContentSize } from './browser-utilities.common';
import { WindowService } from './window.service';

/**
 * ContainerHeightService
 * Provides change events related to height of container elements or browser viewport.
 */
@Injectable({
  providedIn: AngularBrowserUtilitiesModule
})
export class ContainerHeightService {
  private _containerIDs: string[] = [];
  private _containers: Container[] = [];
  private _winResizeObs: Observable<'window' | 'interval' | 'manual'>;
  private _intervalObs: Observable<'window' | 'interval' | 'manual'>;
  private _manualObs: Subject<'window' | 'interval' | 'manual'>;
  private _overallObs: Observable<'window' | 'interval' | 'manual'>;

  readonly INTERVALINMS: number = 250;

  /**
   * Constructor
   * @param _browserWinSvc WindowService object
   */
  constructor(private _browserWinSvc: WindowService) {
    // source from window.resize
    this._winResizeObs = this._browserWinSvc.resizeEvent.pipe(
      map((): 'window' | 'interval' => {
        return 'window';
      })
    );

    // interval
    this._intervalObs = interval(this.INTERVALINMS).pipe(
      map((): 'window' | 'interval' => {
        return 'interval';
      })
    );

    // manual trigger
    this._manualObs = new Subject<'manual'>();

    // merge all 3 observables
    this._overallObs = this._manualObs.pipe(
      merge(this._winResizeObs),
      merge(this._intervalObs),
      merge(this._manualObs)
    );
  }

  /**
   * Add a new container
   * @param name Name of container (default to 'window')
   * @param containerElem If specified, a HTMLElement of the container. Otherwise window object is assumed as the container.
   * @description "window" is a reserved name. If containerElem is not specified/null, name will be set to "window". If name is "window", containerElem will be ignored and window object will used as container.
   */
  addContainer(name: string = 'window', containerElem: HTMLElement = null): IContainer {
    // validate
    if ((name === null) || (name.trim() === '')) {
      throw new Error(`Invalid container name -- ${ name }`);
    }

    // trim and lowercase name
    name = name.trim().toLowerCase();

    // enforce "window" and window object
    if (containerElem === null) {
      name = 'window';
    } else if (name === 'window') {
      containerElem = null;
    }

    // check if already exist
    const contID: number = this._containerIDs.findIndex((val: string): boolean => {
      return (val === name);
    });

    if (contID !== -1) {
      // already exist
      return this._containers[name];
    }

    // create new
    const cont: Container = new Container(name, this._overallObs, containerElem, this._browserWinSvc);

    this._containerIDs.push(name);
    this._containers[name] = cont;

    return cont;
  }

  /**
   * Returns a container based on name
   * @param name Name of container
   */
  getContainer(name: string): IContainer {
    // fix name
    name = name || '';
    name = name.trim().toLowerCase();

    return (this._containers[name] as IContainer);
  }

  /**
   * Manually triggers update
   */
  triggerEvent(): void {
    this._manualObs.next('manual');
  }

  /**
   * Returns size of an element
   * @param elem HTML element
   */
  getElementSize(elem: HTMLElement): ISize {
    return WindowService.getElementSize(elem);
  }

  /**
   * Gets the number of containers (mainly for unit test)
   */
  get containersCount(): number {
    return this._containerIDs.length;
  }
}

/**
 * Event trigger types
 */
enum TriggerTypes {
  'AVAILABLESIZE' = 0,
  'TALLESTCONTENT',
  'CONTAINERSIZE'
}

/**
 * Trigger result inteface
 */
interface TriggerResult {
  type: TriggerTypes;
  result: IAvailableSize;
}

/**
 * Wrapper for uuid()
 */
function createID() {
  return uuid();
}

/**
 * Container class
 */
class Container implements IContainer {
  private _ID: string = createID();
  private _name: string;
  private _contents: HTMLElement[];
  private _containerElem: HTMLElement;
  private _obs: Observable<string>;
  private _sub: Subject<TriggerResult>;

  private _subAvailSize: Subject<IAvailableSize> = new BehaviorSubject<IAvailableSize>(null);
  private _subTallestContent: Subject<IAvailableSize> = new BehaviorSubject<IAvailableSize>(null);
  private _subContSize: Subject<IAvailableSize> = new BehaviorSubject<IAvailableSize>(null);

  // record keeping
  private _lastContainerSize: ISize = null;
  private _lastAvailableSize: ISize = null;
  private _lastTallestContent: IContentSize = null;

  /**
   * Cosntructor
   * @param name Name of this container
   * @param obs Observable that triggers calculation of available height
   * @param containerElem Container element
   */
  constructor(name: string, obs: Observable<string>, containerElem: HTMLElement, private _browWinSvc: WindowService) {
    this._name = name.trim().toLowerCase();
    this._contents = [];
    this._obs = obs;
    this._containerElem = containerElem;
    this._sub = new Subject<TriggerResult>();

    // subscribe to trigger available height change
    this._obs.subscribe((obsTrigger: string) => {
      // determine container size
      const contHasChanged = this.updateContainerSize();

      if (contHasChanged) {
        this._sub.next({
          type: TriggerTypes.CONTAINERSIZE,
          result: {
            containerSize: this._lastContainerSize,
            contents: [],
            selectedContent: null,
            width: this._lastContainerSize.width,
            height: this._lastContainerSize.height
          }
        } as TriggerResult);
      }

      // determine contents sizes
      const contentSizes: IContentSize[] = this._browWinSvc.elementsSizes(this._contents);

      // available size updates
      let availSize: IAvailableSize = this.hasAvailableSizeChanged(this._lastContainerSize, contentSizes);

      // notify if something has changed
      if (availSize !== null) {
        this._sub.next({
          type: TriggerTypes.AVAILABLESIZE,
          result: availSize
        } as TriggerResult);
      }

      // tallest content update
      availSize = this.hasTallestContentChanged(this._lastContainerSize, contentSizes);

      // notify if something has changed
      if (availSize !== null) {
        this._sub.next({
          type: TriggerTypes.TALLESTCONTENT,
          result: availSize
        } as TriggerResult);
      }
    });

    // subscribe to changes and then trigger the respective subject
    this._sub.subscribe((val: TriggerResult) => {
      switch (val.type) {
        case TriggerTypes.AVAILABLESIZE:
          this._subAvailSize.next(val.result);
          break;

        case TriggerTypes.TALLESTCONTENT:
          this._subTallestContent.next(val.result);
          break;

        case TriggerTypes.CONTAINERSIZE:
          this._subContSize.next(val.result);
      }
    });
  }

  /**
   * Determine if available size has changed
   * @param contSize Container size
   * @param contentSizes Size of each contents
   * @returns null if available size has not changed. Otherwise, IAvailableSize object
   */
  private hasAvailableSizeChanged(contSize: ISize, contentSizes: IContentSize[]): IAvailableSize {
    // default return
    const ret: IAvailableSize = {
      containerSize: contSize,
      contents: contentSizes,
      selectedContent: null,
      width: contSize.width,
      height: contSize.height
    };

    // calculate total height and width of contents
    const contentsSize: ISize = contentSizes.reduce((ary: ISize, val: IContentSize) => {
      ary.width += val.contentSize.width;
      ary.height += val.contentSize.height;

      return ary;
    }, { width: 0, height: 0 });

    // update return value
    ret.width -= contentsSize.width;
    ret.height -= contentsSize.height;

    // check if something has changed
    if ((this._lastAvailableSize === null) || (this._lastAvailableSize.width !== ret.width) || (this._lastAvailableSize.height !== ret.height)) {
      this._lastAvailableSize = ret;
      return ret;
    } else {
      return null;
    }
  }

  /**
   * Determine if tallest content has changed
   * @param contSize Container size
   * @param contentSizes Size of each contents
   * @returns null if available size has not changed. Otherwise, IAvailableSize object
   */
  private hasTallestContentChanged(contSize: ISize, contentSizes: IContentSize[]): IAvailableSize {
    // default return
    const ret: IAvailableSize = {
      containerSize: contSize,
      contents: contentSizes,
      selectedContent: null,
      width: contSize.width,
      height: contSize.height
    };

    // determine the tallest content
    const tallest: IContentSize = contentSizes.reduce((last: IContentSize, cur: IContentSize): IContentSize => {
      // shortcut for first pass
      if (last === null) {
        return cur;
      }

      // return the taller one
      return (cur.contentSize.height > last.contentSize.height ? cur : last);
    }, null);

    // if tallest === null - means there is no valid element
    if (tallest === null) {
      return null;
    }

    // get ch__ID values
    const lastTallestID = this._lastTallestContent !== null ? (this._lastTallestContent.content as any).ch__ID : '';
    const curTallestID = (tallest.content as any).ch__ID;

    if ((this._lastTallestContent === null) || (lastTallestID !== curTallestID)) {
      // no previous content or it is now different content
      this._lastTallestContent = tallest;
      ret.selectedContent = tallest;
    } else if (this._lastTallestContent.contentSize.height !== tallest.contentSize.height) {
      // same content - but height has changed
      ret.selectedContent = tallest;
    } else {
      return null;
    }

    this._lastTallestContent = tallest;
    return ret;
  }

  /**
   * Gets name
   */
  get name() {
    return this._name;
  }

  /** 
   * Gets observable that will emit when available size (width and/or height) has changed
   * @description Available size is defined as container.width - sum(contents.width) and container.height - sum(contents.height)
   */
  get availableSizeEvent(): Observable<IAvailableSize> {
    return this._subAvailSize.pipe(
      filter((val: IAvailableSize): boolean => {
        return (val !== null);
      })
    );
  }

  /**
   * Gets observable that will emit when available size has changed and it will include tallest content as selectedContent has changed
   * @description Tallest content returns the content with the biggest height value
   */
  get tallestContentEvent(): Observable<IAvailableSize> {
    return this._subTallestContent.pipe(
      filter((val: IAvailableSize): boolean => {
        return (val !== null);
      })
    );
  }

  /**
   * Gets observable that will emit when container size has changed
   */
  get containerSizeEvent(): Observable<IAvailableSize> {
    return this._subContSize.pipe(
      filter((val: IAvailableSize): boolean => {
        return (val !== null);
      })
    );
  }

  /**
   * Gets container element (null means window object)
   */
  get containerElement(): HTMLElement {
    return this._containerElem;
  }

  /**
   * Returns true if container size has changed since last check, false otherwise.
   * @description This function will update last container size if it has changed
   */
  private updateContainerSize(): boolean {
    // get new size
    let contSize: ISize = null;

    if (this.name === 'window') {
      contSize = this._browWinSvc.windowSize;
    } else {
      contSize = this._browWinSvc.elementSize(this._containerElem);
    }

    // check if has changed - ignoring WIDTH change since this service is for height
    let hasChanged: boolean = false;

    if (this._lastContainerSize === null) {
      hasChanged = true;
    } else if (this._lastContainerSize.height !== contSize.height) {
      hasChanged = true;
    } else if (this._lastContainerSize.width !== contSize.width) {
      hasChanged = true;
    }

    // update our reference
    if (hasChanged) {
      this._lastContainerSize = contSize;
    }

    return hasChanged;
  }

  /**
   * Adds content's HTMLElement into the container/group
   * @param elemRef HTMLElement of the content to add to this group
   * @returns fn() to remove elemRef from the container/group
   */
  addContent(elemRef: HTMLElement): () => void {
    // assign ch__ID
    WindowService.assignIDToElement(elemRef);

    const elem: any = elemRef; // need to be able to access ch__ID

    // ensure content does not get added again
    const found: HTMLElement[] = this._contents.filter((val: any): boolean => {
      return (elem.ch__ID === val.ch__ID);
    });

    if (found.length === 0) {
      // not yet in collection
      // add to content
      this._contents.push(elemRef);
    }

    // return function to remove this element from contents array
    return () => {
      this._contents = this._contents.filter((val: HTMLElement): boolean => {
        return (val !== elemRef);
      });
    };
  }

  /**
   * Checks if HTMLElement is part of the container/group
   * @param elemRef HTMLElement to search for
   */
  contains(elemRef: HTMLElement): boolean {
    return (this._contents.indexOf(elemRef) >= 0);
  }
}
