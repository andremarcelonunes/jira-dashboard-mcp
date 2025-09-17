"""
Ultra-fast cache-first manager for instant dashboard loading
Serves cached data immediately while updating in background
"""
import json
import os
import asyncio
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from pathlib import Path

class UltraFastCache:
    def __init__(self, cache_dir: str = "cache"):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)
        
        # Cache file paths
        self.agile_cache_file = self.cache_dir / "agile_metrics.json"
        self.executive_cache_file = self.cache_dir / "executive_metrics.json"
        
        # Background update control
        self._updating = False
        self._update_interval = 30  # seconds
        
    def _read_cache_file(self, file_path: Path) -> Optional[Dict[str, Any]]:
        """Read cache file safely"""
        try:
            if file_path.exists():
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return data
        except Exception as e:
            print(f"Error reading cache file {file_path}: {e}")
        return None
    
    def _write_cache_file(self, file_path: Path, data: Dict[str, Any]) -> bool:
        """Write cache file safely"""
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False, default=str)
            return True
        except Exception as e:
            print(f"Error writing cache file {file_path}: {e}")
            return False
    
    def get_agile_metrics_instant(self) -> Optional[Dict[str, Any]]:
        """Get agile metrics instantly from cache"""
        cache_data = self._read_cache_file(self.agile_cache_file)
        if cache_data:
            # Add cache metadata
            cache_data['_cache_served'] = True
            cache_data['_cache_timestamp'] = datetime.now().isoformat()
            print("⚡ Served INSTANT agile metrics from cache")
            return cache_data
        return None
    
    def get_executive_metrics_instant(self) -> Optional[Dict[str, Any]]:
        """Get executive metrics instantly from cache"""
        cache_data = self._read_cache_file(self.executive_cache_file)
        if cache_data:
            # Add cache metadata
            cache_data['_cache_served'] = True
            cache_data['_cache_timestamp'] = datetime.now().isoformat()
            print("⚡ Served INSTANT executive metrics from cache")
            return cache_data
        return None
    
    def update_agile_cache(self, data: Dict[str, Any]) -> bool:
        """Update agile metrics cache"""
        # Add timestamp
        data['_cached_at'] = datetime.now().isoformat()
        data['_cache_version'] = 1
        success = self._write_cache_file(self.agile_cache_file, data)
        if success:
            print("💾 Agile metrics cache updated")
        return success
    
    def update_executive_cache(self, data: Dict[str, Any]) -> bool:
        """Update executive metrics cache"""
        # Add timestamp
        data['_cached_at'] = datetime.now().isoformat()
        data['_cache_version'] = 1
        success = self._write_cache_file(self.executive_cache_file, data)
        if success:
            print("💾 Executive metrics cache updated")
        return success
    
    def is_cache_fresh(self, cache_type: str, max_age_minutes: int = 2) -> bool:
        """Check if cache is fresh enough"""
        file_path = self.agile_cache_file if cache_type == 'agile' else self.executive_cache_file
        
        try:
            if not file_path.exists():
                return False
                
            # Check file modification time
            file_mtime = datetime.fromtimestamp(file_path.stat().st_mtime)
            age = datetime.now() - file_mtime
            
            return age < timedelta(minutes=max_age_minutes)
        except Exception:
            return False
    
    async def background_update_agile(self, update_func):
        """Update agile cache in background"""
        if self._updating:
            print("🔄 Background update already in progress")
            return
            
        self._updating = True
        try:
            print("🔄 Starting background agile metrics update...")
            fresh_data = await update_func()
            if fresh_data:
                # Convert Pydantic model to dict if needed
                if hasattr(fresh_data, 'dict'):
                    fresh_data = fresh_data.dict()
                
                self.update_agile_cache(fresh_data)
                print("✅ Background agile metrics update completed")
            else:
                print("❌ Background agile metrics update failed")
        except Exception as e:
            print(f"❌ Background agile metrics update error: {e}")
        finally:
            self._updating = False
    
    async def background_update_executive(self, update_func):
        """Update executive cache in background"""
        if self._updating:
            print("🔄 Background update already in progress")
            return
            
        self._updating = True
        try:
            print("🔄 Starting background executive metrics update...")
            fresh_data = await update_func()
            if fresh_data:
                # Convert Pydantic model to dict if needed
                if hasattr(fresh_data, 'dict'):
                    fresh_data = fresh_data.dict()
                
                self.update_executive_cache(fresh_data)
                print("✅ Background executive metrics update completed")
            else:
                print("❌ Background executive metrics update failed")
        except Exception as e:
            print(f"❌ Background executive metrics update error: {e}")
        finally:
            self._updating = False
    
    def get_cache_status(self) -> Dict[str, Any]:
        """Get cache status information"""
        status = {
            "agile_cache_exists": self.agile_cache_file.exists(),
            "executive_cache_exists": self.executive_cache_file.exists(),
            "agile_cache_fresh": self.is_cache_fresh('agile'),
            "executive_cache_fresh": self.is_cache_fresh('executive'),
            "updating": self._updating
        }
        
        # Add file timestamps
        for cache_type, file_path in [('agile', self.agile_cache_file), ('executive', self.executive_cache_file)]:
            if file_path.exists():
                try:
                    mtime = datetime.fromtimestamp(file_path.stat().st_mtime)
                    status[f"{cache_type}_last_modified"] = mtime.isoformat()
                    status[f"{cache_type}_age_seconds"] = (datetime.now() - mtime).total_seconds()
                except Exception:
                    pass
        
        return status

# Global cache instance
ultra_cache = UltraFastCache()